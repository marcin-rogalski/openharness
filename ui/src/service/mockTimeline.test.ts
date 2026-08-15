import { describe, expect, it } from 'vitest'
import { createMockTimelineEntries } from './mockTimeline'

describe('createMockTimelineEntries', () => {
	it('creates thinking, tool call, and response entries for the project', () => {
		const entries = createMockTimelineEntries('project-1', 'Hello')

		expect(entries).toHaveLength(4)
		expect(entries.map((entry) => entry.projectId)).toEqual([
			'project-1',
			'project-1',
			'project-1',
			'project-1',
		])
		expect(entries.map((entry) => entry.type)).toEqual([
			'agent_thinking',
			'agent_tool_call',
			'agent_tool_call',
			'agent_response',
		])
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

	it('creates unique ids for each entry', () => {
		const entries = createMockTimelineEntries('project-1', 'Hello')

		expect(new Set(entries.map((entry) => entry.id)).size).toBe(entries.length)
	})
})
