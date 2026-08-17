import { describe, expect, it } from 'vitest'
import type { ApprovalPort } from '@/application/ports/adapters/ApprovalPort'
import type {
	PolicyDecision,
	PolicyPort,
} from '@/application/ports/adapters/PolicyPort'
import type { SandboxPort } from '@/application/ports/adapters/SandboxPort'
import type { ToolExecutorPort } from '@/application/ports/adapters/ToolExecutorPort'
import type { ToolRegistryPort } from '@/application/ports/adapters/ToolRegistryPort'
import type { ToolCall } from '@/domain/ToolCall'
import { ToolNotFoundError } from '@/domain/ToolNotFoundError'
import ToolExecutionService from './ToolExecutionService'

function createCall(overrides: Partial<ToolCall> = {}): ToolCall {
	return {
		id: 'call-1',
		sessionId: 'session-1',
		toolId: 'mock_tool',
		input: { query: 'test' },
		status: 'pending',
		createdAt: '2026-01-01T00:00:00Z',
		...overrides,
	}
}

function createRegistry(toolId = 'mock_tool') {
	return {
		listTools: async () => [],
		getTool: async (id: string) =>
			id === toolId
				? {
						id,
						name: 'Mock',
						description: 'test',
						inputSchema: {},
						sandboxLevel: 'none' as const,
					}
				: null,
	} as ToolRegistryPort
}

function createExecutor(output: unknown = { result: 'ok' }) {
	return {
		execute: async () => ({
			toolCallId: '',
			status: 'success' as const,
			output,
			error: null,
			frozen: false,
		}),
	} as ToolExecutorPort
}

function createPolicy(decision: PolicyDecision = 'allow') {
	return {
		evaluate: async () => decision,
	} as PolicyPort
}

function createApproval(decision: 'approved' | 'denied' = 'approved') {
	return {
		requestApproval: async () => decision,
		decide: () => {},
	} as ApprovalPort
}

function createSandbox(allowed = true) {
	return {
		checkAccess: async () => ({
			allowed,
			reason: allowed ? null : 'denied by sandbox',
		}),
	} as SandboxPort
}

describe('ToolExecutionService', () => {
	it('executes a tool call successfully when policy allows', async () => {
		const service = new ToolExecutionService(
			createRegistry(),
			createExecutor({ data: 42 }),
			createPolicy('allow'),
			createApproval(),
			createSandbox(),
		)

		const result = await service.execute(createCall())

		expect(result.status).toBe('success')
		expect(result.output).toEqual({ data: 42 })
		expect(result.error).toBeNull()
		expect(result.frozen).toBe(true)
		expect(Object.isFrozen(result)).toBe(true)
	})

	it('returns a frozen error when policy denies', async () => {
		const service = new ToolExecutionService(
			createRegistry(),
			createExecutor(),
			createPolicy('deny'),
			createApproval(),
			createSandbox(),
		)

		const result = await service.execute(createCall())

		expect(result.status).toBe('error')
		expect(result.error).toBe('Tool call denied by policy')
		expect(result.frozen).toBe(true)
		expect(Object.isFrozen(result)).toBe(true)
	})

	it('requests approval when policy requires it', async () => {
		const service = new ToolExecutionService(
			createRegistry(),
			createExecutor({ approved: true }),
			createPolicy('require_approval'),
			createApproval('approved'),
			createSandbox(),
		)

		const result = await service.execute(createCall())

		expect(result.status).toBe('success')
		expect(result.output).toEqual({ approved: true })
	})

	it('returns a frozen error when approval is denied', async () => {
		const service = new ToolExecutionService(
			createRegistry(),
			createExecutor(),
			createPolicy('require_approval'),
			createApproval('denied'),
			createSandbox(),
		)

		const result = await service.execute(createCall())

		expect(result.status).toBe('error')
		expect(result.error).toBe('Tool call denied by approval')
		expect(result.frozen).toBe(true)
	})

	it('throws ToolNotFoundError for unknown tools', async () => {
		const service = new ToolExecutionService(
			createRegistry('other_tool'),
			createExecutor(),
			createPolicy('allow'),
			createApproval(),
			createSandbox(),
		)

		await expect(
			service.execute(createCall({ toolId: 'mock_tool' })),
		).rejects.toThrow(ToolNotFoundError)
	})

	it('produces a frozen result that cannot be mutated', async () => {
		const service = new ToolExecutionService(
			createRegistry(),
			createExecutor(),
			createPolicy('allow'),
			createApproval(),
			createSandbox(),
		)

		const result = await service.execute(createCall())

		expect(() => {
			;(result as { output: unknown }).output = 'hacked'
		}).toThrow()
	})

	it('propagates executor errors as frozen results', async () => {
		const executor = {
			execute: async () => ({
				toolCallId: '',
				status: 'error' as const,
				output: null,
				error: 'tool crashed',
				frozen: false,
			}),
		} as ToolExecutorPort

		const service = new ToolExecutionService(
			createRegistry(),
			executor,
			createPolicy('allow'),
			createApproval(),
			createSandbox(),
		)

		const result = await service.execute(createCall())

		expect(result.status).toBe('error')
		expect(result.error).toBe('tool crashed')
		expect(result.frozen).toBe(true)
	})
})
