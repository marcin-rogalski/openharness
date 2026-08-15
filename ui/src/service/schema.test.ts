import { describe, expect, it } from 'vitest'
import { GlobalStateSchema, ProjectSchema, TimelineEntrySchema } from './schema'

describe('ProjectSchema', () => {
	it('parses a valid project', () => {
		expect(
			ProjectSchema.parse({
				id: 'project-1',
				name: 'OpenHarness',
				status: 'running',
			}),
		).toEqual({
			id: 'project-1',
			name: 'OpenHarness',
			status: 'running',
		})
	})

	it('rejects an invalid status', () => {
		expect(() =>
			ProjectSchema.parse({
				id: 'project-1',
				name: 'OpenHarness',
				status: 'unknown',
			}),
		).toThrow()
	})
})

describe('TimelineEntrySchema', () => {
	it('parses a user message entry', () => {
		expect(
			TimelineEntrySchema.parse({
				type: 'user_message',
				id: 'entry-1',
				projectId: 'project-1',
				content: 'Hello',
			}),
		).toEqual({
			type: 'user_message',
			id: 'entry-1',
			projectId: 'project-1',
			content: 'Hello',
		})
	})

	it('parses agent event entries', () => {
		expect(
			TimelineEntrySchema.parse({
				type: 'agent_thinking',
				id: 'entry-2',
				projectId: 'project-1',
				text: 'Thinking',
			}),
		).toHaveProperty('type', 'agent_thinking')

		expect(
			TimelineEntrySchema.parse({
				type: 'agent_tool_call',
				id: 'entry-3',
				projectId: 'project-1',
				tool: 'mock_tool',
				status: 'started',
			}),
		).toHaveProperty('status', 'started')

		expect(
			TimelineEntrySchema.parse({
				type: 'agent_response',
				id: 'entry-4',
				projectId: 'project-1',
				text: 'Done',
			}),
		).toHaveProperty('type', 'agent_response')
	})

	it('rejects an unknown entry type', () => {
		expect(() =>
			TimelineEntrySchema.parse({
				type: 'unknown',
				id: 'entry-5',
				projectId: 'project-1',
			}),
		).toThrow()
	})
})

describe('GlobalStateSchema', () => {
	it('parses a valid state', () => {
		expect(
			GlobalStateSchema.parse({
				projects: [],
				selectedProjectId: null,
				timeline: [],
				error: null,
			}),
		).toEqual({
			projects: [],
			selectedProjectId: null,
			timeline: [],
			error: null,
		})
	})

	it('rejects an invalid selectedProjectId', () => {
		expect(() =>
			GlobalStateSchema.parse({
				projects: [],
				selectedProjectId: 'nope',
				timeline: [],
				error: null,
			}),
		).toThrow()
	})
})
