import { describe, expect, it, vi } from 'vitest'
import type { AgentRuntimePort } from '@/application/ports/adapters/AgentRuntimePort'
import type { EventLogPort } from '@/application/ports/adapters/EventLogPort'
import type { ToolRegistryPort } from '@/application/ports/adapters/ToolRegistryPort'
import type { AgentLoopConfig } from '@/domain/AgentLoopConfig'
import type { SessionEvent } from '@/domain/SessionEvent'
import AgentLoopService from './AgentLoopService'
import type ToolExecutionService from './ToolExecutionService'
import type HookRegistryService from './HookRegistryService'

function createEventLog(): EventLogPort & { events: SessionEvent[] } {
	const events: SessionEvent[] = []
	return {
		events,
		append: async (event: SessionEvent) => {
			events.push(event)
		},
		listBySession: async () => events,
	}
}

function createToolRegistry(tools: { id: string; name: string; description: string; inputSchema: Record<string, unknown>; sandboxLevel: string }[] = []) {
	return {
		listTools: async () => tools,
		getTool: async (id: string) => tools.find((t) => t.id === id) ?? null,
	} as unknown as ToolRegistryPort
}

function createToolExecution() {
	return {
		execute: vi.fn().mockResolvedValue({
			toolCallId: 'call-1',
			status: 'success' as const,
			output: { result: 'ok' },
			error: null,
			frozen: true,
		}),
	} as unknown as ToolExecutionService
}

function createHooks(allowed = true) {
	return {
		invoke: vi.fn().mockResolvedValue(
			allowed
				? { allowed: true }
				: { allowed: false, deniedBy: 'test-hook', reason: 'not allowed' },
		),
	} as unknown as HookRegistryService
}

const config: AgentLoopConfig = { maxSteps: 3, maxParallelTools: 2 }

describe('AgentLoopService', () => {
	it('completes when model returns finishReason stop', async () => {
		const eventLog = createEventLog()
		const runtime = {
			handle: vi.fn().mockResolvedValue({
				thinking: null,
				toolCalls: [],
				response: 'Done',
				finishReason: 'stop' as const,
				usage: { inputTokens: 10, outputTokens: 5 },
			}),
		} as unknown as AgentRuntimePort

		const service = new AgentLoopService(
			runtime,
			createToolExecution(),
			createToolRegistry(),
			eventLog,
			createHooks(),
		)

		const result = await service.run({
			sessionId: 's1',
			projectId: 'p1',
			turnId: 't1',
			config,
		})

		expect(result.status).toBe('completed')
		expect(result.steps).toBe(1)
		expect(runtime.handle).toHaveBeenCalledTimes(1)

		const types = eventLog.events.map((e) => e.type)
		expect(types).toEqual([
			'turn_started',
			'step_started',
			'model_output_received',
			'turn_ended',
		])
	})

	it('executes tool calls and continues to next step', async () => {
		const eventLog = createEventLog()
		const runtime = {
			handle: vi.fn()
				.mockResolvedValueOnce({
					thinking: null,
					toolCalls: [{ id: 'call-1', tool: 'search', input: '{"q":"test"}' }],
					response: '',
					finishReason: 'tool_calls' as const,
					usage: { inputTokens: 10, outputTokens: 5 },
				})
				.mockResolvedValueOnce({
					thinking: null,
					toolCalls: [],
					response: 'Found it',
					finishReason: 'stop' as const,
					usage: { inputTokens: 20, outputTokens: 10 },
				}),
		} as unknown as AgentRuntimePort

		const toolExecution = createToolExecution()
		const service = new AgentLoopService(
			runtime,
			toolExecution,
			createToolRegistry(),
			eventLog,
			createHooks(),
		)

		const result = await service.run({
			sessionId: 's1',
			projectId: 'p1',
			turnId: 't1',
			config,
		})

		expect(result.status).toBe('completed')
		expect(result.steps).toBe(2)
		expect(runtime.handle).toHaveBeenCalledTimes(2)
		expect(toolExecution.execute).toHaveBeenCalledTimes(1)

		const types = eventLog.events.map((e) => e.type)
		expect(types).toContain('tool_call_requested')
		expect(types).toContain('tool_result_produced')
	})

	it('returns blocked when hook denies', async () => {
		const eventLog = createEventLog()
		const runtime = {
			handle: vi.fn(),
		} as unknown as AgentRuntimePort

		const service = new AgentLoopService(
			runtime,
			createToolExecution(),
			createToolRegistry(),
			eventLog,
			createHooks(false),
		)

		const result = await service.run({
			sessionId: 's1',
			projectId: 'p1',
			turnId: 't1',
			config,
		})

		expect(result.status).toBe('blocked')
		expect(result.reason).toBe('not allowed')
		expect(runtime.handle).not.toHaveBeenCalled()

		const turnEnded = eventLog.events.find((e) => e.type === 'turn_ended')
		expect(turnEnded!.payload).toEqual({
			reason: 'blocked',
			deniedBy: 'test-hook',
			hookReason: 'not allowed',
		})
	})

	it('returns max_steps when loop exhausts all steps', async () => {
		const eventLog = createEventLog()
		const runtime = {
			handle: vi.fn().mockResolvedValue({
				thinking: null,
				toolCalls: [{ id: 'call-1', tool: 'search', input: '{}' }],
				response: '',
				finishReason: 'tool_calls' as const,
				usage: { inputTokens: 10, outputTokens: 5 },
			}),
		} as unknown as AgentRuntimePort

		const service = new AgentLoopService(
			runtime,
			createToolExecution(),
			createToolRegistry(),
			eventLog,
			createHooks(),
		)

		const result = await service.run({
			sessionId: 's1',
			projectId: 'p1',
			turnId: 't1',
			config: { maxSteps: 2, maxParallelTools: 1 },
		})

		expect(result.status).toBe('max_steps')
		expect(result.steps).toBe(2)
		expect(runtime.handle).toHaveBeenCalledTimes(2)

		const turnEnded = eventLog.events.find((e) => e.type === 'turn_ended')
		expect(turnEnded!.payload.reason).toBe('max_steps')
	})

	it('returns error when runtime throws', async () => {
		const eventLog = createEventLog()
		const runtime = {
			handle: vi.fn().mockRejectedValue(new Error('API exploded')),
		} as unknown as AgentRuntimePort

		const service = new AgentLoopService(
			runtime,
			createToolExecution(),
			createToolRegistry(),
			eventLog,
			createHooks(),
		)

		const result = await service.run({
			sessionId: 's1',
			projectId: 'p1',
			turnId: 't1',
			config,
		})

		expect(result.status).toBe('error')
		expect(result.error).toBe('API exploded')

		const errorEvent = eventLog.events.find((e) => e.type === 'error_occurred')
		expect(errorEvent!.payload.error).toBe('API exploded')
	})

	it('returns aborted when abortSignal is triggered', async () => {
		const eventLog = createEventLog()
		const runtime = {
			handle: vi.fn(),
		} as unknown as AgentRuntimePort

		const controller = new AbortController()
		controller.abort()

		const service = new AgentLoopService(
			runtime,
			createToolExecution(),
			createToolRegistry(),
			eventLog,
			createHooks(),
		)

		const result = await service.run({
			sessionId: 's1',
			projectId: 'p1',
			turnId: 't1',
			config,
			abortSignal: controller.signal,
		})

		expect(result.status).toBe('aborted')
		expect(runtime.handle).not.toHaveBeenCalled()
	})

	it('returns max_tokens when finishReason is max_tokens', async () => {
		const eventLog = createEventLog()
		const runtime = {
			handle: vi.fn().mockResolvedValue({
				thinking: null,
				toolCalls: [],
				response: 'truncated',
				finishReason: 'max_tokens' as const,
				usage: { inputTokens: 10, outputTokens: 5 },
			}),
		} as unknown as AgentRuntimePort

		const service = new AgentLoopService(
			runtime,
			createToolExecution(),
			createToolRegistry(),
			eventLog,
			createHooks(),
		)

		const result = await service.run({
			sessionId: 's1',
			projectId: 'p1',
			turnId: 't1',
			config,
		})

		expect(result.status).toBe('max_tokens')
	})

	it('handles non-object JSON in tool input (safeParseJson fallback)', async () => {
		const eventLog = createEventLog()
		const runtime = {
			handle: vi.fn()
				.mockResolvedValueOnce({
					thinking: null,
					toolCalls: [{ id: 'call-1', tool: 'search', input: 'plain-text' }],
					response: '',
					finishReason: 'tool_calls' as const,
					usage: { inputTokens: 10, outputTokens: 5 },
				})
				.mockResolvedValueOnce({
					thinking: null,
					toolCalls: [],
					response: 'done',
					finishReason: 'stop' as const,
					usage: { inputTokens: 10, outputTokens: 5 },
				}),
		} as unknown as AgentRuntimePort

		const toolExecution = createToolExecution()
		const service = new AgentLoopService(
			runtime,
			toolExecution,
			createToolRegistry(),
			eventLog,
			createHooks(),
		)

		await service.run({
			sessionId: 's1',
			projectId: 'p1',
			turnId: 't1',
			config,
		})

		expect(toolExecution.execute).toHaveBeenCalled()
		const callArg = (toolExecution.execute as unknown as vi.Mock).mock.calls[0][0]
		expect(callArg.input).toEqual({ value: 'plain-text' })
	})

	it('handles numeric JSON in tool input (safeParseJson non-object)', async () => {
		const eventLog = createEventLog()
		const runtime = {
			handle: vi.fn()
				.mockResolvedValueOnce({
					thinking: null,
					toolCalls: [{ id: 'call-1', tool: 'calc', input: '42' }],
					response: '',
					finishReason: 'tool_calls' as const,
					usage: { inputTokens: 10, outputTokens: 5 },
				})
				.mockResolvedValueOnce({
					thinking: null,
					toolCalls: [],
					response: 'done',
					finishReason: 'stop' as const,
					usage: { inputTokens: 10, outputTokens: 5 },
				}),
		} as unknown as AgentRuntimePort

		const toolExecution = createToolExecution()
		const service = new AgentLoopService(
			runtime,
			toolExecution,
			createToolRegistry(),
			eventLog,
			createHooks(),
		)

		await service.run({
			sessionId: 's1',
			projectId: 'p1',
			turnId: 't1',
			config,
		})

		const callArg = (toolExecution.execute as unknown as vi.Mock).mock.calls[0][0]
		expect(callArg.input).toEqual({ value: 42 })
	})
})
