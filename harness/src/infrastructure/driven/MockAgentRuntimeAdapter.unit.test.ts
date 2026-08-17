import { describe, expect, it } from 'vitest'
import MockAgentRuntimeAdapter from './MockAgentRuntimeAdapter'

describe('MockAgentRuntimeAdapter', () => {
	it('returns thinking, tool call, and response', async () => {
		const runtime = new MockAgentRuntimeAdapter()

		const result = await runtime.handle({
			sessionId: 'session-1',
			projectId: 'project-1',
			context: [{ role: 'user', content: 'Hello' }],
		})

		expect(result.thinking).toBe('Thinking about: Hello')
		expect(result.toolCalls).toEqual([
			{ tool: 'mock_tool', input: 'Hello', output: 'ok' },
		])
		expect(result.response).toBe('Mock response to: Hello')
	})

	it('uses the last user message from context', async () => {
		const runtime = new MockAgentRuntimeAdapter()

		const result = await runtime.handle({
			sessionId: 'session-1',
			projectId: 'project-1',
			context: [
				{ role: 'user', content: 'First' },
				{ role: 'assistant', content: 'Response to first' },
				{ role: 'user', content: 'Second' },
			],
		})

		expect(result.thinking).toBe('Thinking about: Second')
		expect(result.response).toBe('Mock response to: Second')
	})

	it('handles empty context gracefully', async () => {
		const runtime = new MockAgentRuntimeAdapter()

		const result = await runtime.handle({
			sessionId: 'session-1',
			projectId: 'project-1',
			context: [],
		})

		expect(result.thinking).toBe('Thinking about: ')
		expect(result.response).toBe('Mock response to: ')
	})
})
