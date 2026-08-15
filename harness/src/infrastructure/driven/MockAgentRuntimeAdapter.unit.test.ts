import { describe, expect, it } from 'vitest'
import MockAgentRuntimeAdapter from './MockAgentRuntimeAdapter'

describe('MockAgentRuntimeAdapter', () => {
	it('returns thinking, tool call, and response entries', async () => {
		const runtime = new MockAgentRuntimeAdapter()

		const entries = await runtime.handle({
			projectId: 'project-1',
			content: 'Hello',
		})

		expect(entries.map((entry) => entry.type)).toEqual([
			'agent_thinking',
			'agent_tool_call',
			'agent_tool_call',
			'agent_response',
		])
		expect(entries.every((entry) => entry.projectId === 'project-1')).toBe(true)
		expect(entries[0]).toMatchObject({ text: 'Thinking about: Hello' })
		expect(entries[1]).toMatchObject({
			tool: 'mock_tool',
			status: 'started',
			input: 'Hello',
		})
		expect(entries[2]).toMatchObject({
			tool: 'mock_tool',
			status: 'completed',
			output: 'ok',
		})
		expect(entries[3]).toMatchObject({ text: 'Mock response to: Hello' })
	})
})
