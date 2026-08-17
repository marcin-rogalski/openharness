import { describe, expect, it } from 'vitest'
import MockAgentRuntimeAdapter, {
	type MockScenario,
} from './MockAgentRuntimeAdapter'
import type { AgentRuntimeRequest } from '@/application/ports/adapters/AgentRuntimePort'

function createRequest(overrides?: Partial<AgentRuntimeRequest>): AgentRuntimeRequest {
	return {
		sessionId: 'session-1',
		projectId: 'project-1',
		turnId: 'turn-1',
		step: 0,
		context: [{ role: 'user', content: 'Hello' }],
		tools: [],
		...overrides,
	}
}

describe('MockAgentRuntimeAdapter', () => {
	it('returns a default response based on the last user message', async () => {
		const runtime = new MockAgentRuntimeAdapter()

		const result = await runtime.handle(createRequest())

		expect(result.thinking).toBe('Thinking about: Hello')
		expect(result.toolCalls).toEqual([])
		expect(result.response).toBe('Mock response to: Hello')
		expect(result.finishReason).toBe('stop')
		expect(result.usage).toEqual({ inputTokens: 10, outputTokens: 20 })
	})

	it('uses the last user message from context', async () => {
		const runtime = new MockAgentRuntimeAdapter()

		const result = await runtime.handle(
			createRequest({
				context: [
					{ role: 'user', content: 'First' },
					{ role: 'assistant', content: 'Response to first' },
					{ role: 'user', content: 'Second' },
				],
			}),
		)

		expect(result.thinking).toBe('Thinking about: Second')
		expect(result.response).toBe('Mock response to: Second')
	})

	it('handles empty context gracefully', async () => {
		const runtime = new MockAgentRuntimeAdapter()

		const result = await runtime.handle(createRequest({ context: [] }))

		expect(result.thinking).toBe('Thinking about: ')
		expect(result.response).toBe('Mock response to: ')
	})

	it('returns scenarios in order when provided', async () => {
		const scenarios: MockScenario[] = [
			{
				toolCalls: [{ id: 'call-1', tool: 'search', input: 'query' }],
				response: '',
				finishReason: 'tool_calls',
			},
			{ response: 'Done' },
		]
		const runtime = new MockAgentRuntimeAdapter(scenarios)

		const first = await runtime.handle(createRequest())
		expect(first.toolCalls).toEqual([
			{ id: 'call-1', tool: 'search', input: 'query' },
		])
		expect(first.finishReason).toBe('tool_calls')
		expect(first.response).toBe('')

		const second = await runtime.handle(createRequest())
		expect(second.toolCalls).toEqual([])
		expect(second.finishReason).toBe('stop')
		expect(second.response).toBe('Done')
	})

	it('falls back to default after scenarios are exhausted', async () => {
		const scenarios: MockScenario[] = [{ response: 'Only one' }]
		const runtime = new MockAgentRuntimeAdapter(scenarios)

		await runtime.handle(createRequest())
		const fallback = await runtime.handle(
			createRequest({
				context: [{ role: 'user', content: 'After' }],
			}),
		)

		expect(fallback.response).toBe('Mock response to: After')
		expect(fallback.finishReason).toBe('stop')
	})

	it('tracks callCount and resets', async () => {
		const runtime = new MockAgentRuntimeAdapter()

		expect(runtime.callCount).toBe(0)

		await runtime.handle(createRequest())
		await runtime.handle(createRequest())
		expect(runtime.callCount).toBe(2)

		runtime.reset()
		expect(runtime.callCount).toBe(0)
	})
})
