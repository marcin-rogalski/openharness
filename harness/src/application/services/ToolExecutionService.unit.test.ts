import { describe, expect, it, vi } from 'vitest'
import type { ApprovalPort } from '@/application/ports/adapters/ApprovalPort'
import type { EventLogPort } from '@/application/ports/adapters/EventLogPort'
import type {
	PolicyDecision,
	PolicyPort,
} from '@/application/ports/adapters/PolicyPort'
import type { SandboxPort } from '@/application/ports/adapters/SandboxPort'
import type { ToolExecutorPort } from '@/application/ports/adapters/ToolExecutorPort'
import type { ToolRegistryPort } from '@/application/ports/adapters/ToolRegistryPort'
import type { SessionEvent } from '@/domain/SessionEvent'
import type { ToolCall } from '@/domain/ToolCall'
import { ToolNotFoundError } from '@/domain/ToolNotFoundError'
import type { ToolExecutionContext } from './ToolExecutionService'
import ToolExecutionService from './ToolExecutionService'

const context: ToolExecutionContext = {
	projectId: 'project-1',
	turnId: 'turn-1',
	stepId: 'step-1',
}

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

function createEventLog() {
	const events: SessionEvent[] = []
	return {
		events,
		port: {
			append: async (e: SessionEvent) => {
				events.push(e)
			},
			listBySession: async () => events,
		} as EventLogPort,
	}
}

describe('ToolExecutionService', () => {
	it('executes a tool call successfully when policy allows', async () => {
		const { port: eventLog } = createEventLog()
		const service = new ToolExecutionService(
			createRegistry(),
			createExecutor({ data: 42 }),
			createPolicy('allow'),
			createApproval(),
			createSandbox(),
			eventLog,
		)

		const result = await service.execute(createCall(), context)

		expect(result.status).toBe('success')
		expect(result.output).toEqual({ data: 42 })
		expect(result.error).toBeNull()
		expect(result.frozen).toBe(true)
		expect(Object.isFrozen(result)).toBe(true)
	})

	it('returns a frozen error when policy denies', async () => {
		const { port: eventLog } = createEventLog()
		const service = new ToolExecutionService(
			createRegistry(),
			createExecutor(),
			createPolicy('deny'),
			createApproval(),
			createSandbox(),
			eventLog,
		)

		const result = await service.execute(createCall(), context)

		expect(result.status).toBe('error')
		expect(result.error).toBe('Tool call denied by policy')
		expect(result.frozen).toBe(true)
		expect(Object.isFrozen(result)).toBe(true)
	})

	it('requests approval when policy requires it', async () => {
		const { events, port: eventLog } = createEventLog()
		const service = new ToolExecutionService(
			createRegistry(),
			createExecutor({ approved: true }),
			createPolicy('require_approval'),
			createApproval('approved'),
			createSandbox(),
			eventLog,
		)

		const result = await service.execute(createCall(), context)

		expect(result.status).toBe('success')
		expect(result.output).toEqual({ approved: true })
		expect(events).toHaveLength(2)
		expect(events[0].type).toBe('approval_requested')
		expect(events[1].type).toBe('approval_decided')
		expect(events[1].payload).toEqual({
			toolCallId: 'call-1',
			decision: 'approved',
		})
	})

	it('returns a frozen error when approval is denied', async () => {
		const { events, port: eventLog } = createEventLog()
		const service = new ToolExecutionService(
			createRegistry(),
			createExecutor(),
			createPolicy('require_approval'),
			createApproval('denied'),
			createSandbox(),
			eventLog,
		)

		const result = await service.execute(createCall(), context)

		expect(result.status).toBe('error')
		expect(result.error).toBe('Tool call denied by approval')
		expect(result.frozen).toBe(true)
		expect(events).toHaveLength(2)
		expect(events[1].payload).toEqual({
			toolCallId: 'call-1',
			decision: 'denied',
		})
	})

	it('throws ToolNotFoundError for unknown tools', async () => {
		const { port: eventLog } = createEventLog()
		const service = new ToolExecutionService(
			createRegistry('other_tool'),
			createExecutor(),
			createPolicy('allow'),
			createApproval(),
			createSandbox(),
			eventLog,
		)

		await expect(
			service.execute(createCall({ toolId: 'mock_tool' }), context),
		).rejects.toThrow(ToolNotFoundError)
	})

	it('produces a frozen result that cannot be mutated', async () => {
		const { port: eventLog } = createEventLog()
		const service = new ToolExecutionService(
			createRegistry(),
			createExecutor(),
			createPolicy('allow'),
			createApproval(),
			createSandbox(),
			eventLog,
		)

		const result = await service.execute(createCall(), context)

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

		const { port: eventLog } = createEventLog()
		const service = new ToolExecutionService(
			createRegistry(),
			executor,
			createPolicy('allow'),
			createApproval(),
			createSandbox(),
			eventLog,
		)

		const result = await service.execute(createCall(), context)

		expect(result.status).toBe('error')
		expect(result.error).toBe('tool crashed')
		expect(result.frozen).toBe(true)
	})

	it('checks sandbox access for tools with sandboxLevel workspace-write', async () => {
		const registry = {
			listTools: async () => [],
			getTool: async () => ({
				id: 'write_tool',
				name: 'Write',
				description: 'writes files',
				inputSchema: {},
				sandboxLevel: 'workspace-write' as const,
			}),
		} as ToolRegistryPort

		const sandbox = {
			checkAccess: vi.fn().mockResolvedValue({ allowed: true, reason: null }),
		} as unknown as SandboxPort

		const { port: eventLog } = createEventLog()
		const service = new ToolExecutionService(
			registry,
			createExecutor(),
			createPolicy('allow'),
			createApproval(),
			sandbox,
			eventLog,
		)

		await service.execute(
			createCall({ toolId: 'write_tool', input: { path: '/tmp/test.txt' } }),
			context,
		)

		expect(sandbox.checkAccess).toHaveBeenCalledWith(
			'workspace-write',
			'/tmp/test.txt',
		)
	})

	it('denies when sandbox rejects access', async () => {
		const registry = {
			listTools: async () => [],
			getTool: async () => ({
				id: 'write_tool',
				name: 'Write',
				description: 'writes files',
				inputSchema: {},
				sandboxLevel: 'workspace-write' as const,
			}),
		} as ToolRegistryPort

		const sandbox = {
			checkAccess: vi.fn().mockResolvedValue({
				allowed: false,
				reason: 'outside workspace',
			}),
		} as unknown as SandboxPort

		const { port: eventLog } = createEventLog()
		const service = new ToolExecutionService(
			registry,
			createExecutor(),
			createPolicy('allow'),
			createApproval(),
			sandbox,
			eventLog,
		)

		const result = await service.execute(
			createCall({ toolId: 'write_tool', input: { filePath: '/etc/passwd' } }),
			context,
		)

		expect(result.status).toBe('error')
		expect(result.error).toBe('Sandbox denied: outside workspace')
	})

	it('extracts path from file key', async () => {
		const registry = {
			listTools: async () => [],
			getTool: async () => ({
				id: 'read_tool',
				name: 'Read',
				description: 'reads files',
				inputSchema: {},
				sandboxLevel: 'read-only' as const,
			}),
		} as ToolRegistryPort

		const sandbox = {
			checkAccess: vi.fn().mockResolvedValue({ allowed: true, reason: null }),
		} as unknown as SandboxPort

		const { port: eventLog } = createEventLog()
		const service = new ToolExecutionService(
			registry,
			createExecutor(),
			createPolicy('allow'),
			createApproval(),
			sandbox,
			eventLog,
		)

		await service.execute(
			createCall({ toolId: 'read_tool', input: { file: '/tmp/data.json' } }),
			context,
		)

		expect(sandbox.checkAccess).toHaveBeenCalledWith(
			'read-only',
			'/tmp/data.json',
		)
	})
})
