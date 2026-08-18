import { describe, expect, it } from 'vitest'
import { projectEventsToTimeline, stringifyEventValue } from './projectEvents'
import type { SessionEvent } from './schema'

function createEvent(
	overrides: Partial<SessionEvent> & { type: SessionEvent['type'] },
): SessionEvent {
	return {
		id: 'event-1',
		sessionId: 'session-1',
		projectId: 'project-1',
		turnId: null,
		stepId: null,
		timestamp: '2026-01-01T00:00:00Z',
		actor: 'agent',
		payload: {},
		visibility: 'both',
		...overrides,
	}
}

describe('stringifyEventValue', () => {
	it('returns undefined for null and undefined', () => {
		expect(stringifyEventValue(null)).toBeUndefined()
		expect(stringifyEventValue(undefined)).toBeUndefined()
	})

	it('returns strings unchanged', () => {
		expect(stringifyEventValue('hello')).toBe('hello')
	})

	it('serializes objects', () => {
		expect(stringifyEventValue({ command: 'ls' })).toBe('{"command":"ls"}')
	})

	it('falls back to String for values that cannot be serialized', () => {
		const circular: Record<string, unknown> = {}
		circular.self = circular

		expect(stringifyEventValue(circular)).toBe('[object Object]')
	})
})

describe('projectEventsToTimeline', () => {
	it('projects user messages', () => {
		const entries = projectEventsToTimeline([
			createEvent({
				type: 'user_message',
				actor: 'user',
				payload: { content: 'Hello' },
			}),
		])

		expect(entries).toEqual([
			{
				type: 'user_message',
				id: 'event-1',
				projectId: 'project-1',
				content: 'Hello',
			},
		])
	})

	it('ignores user messages without string content', () => {
		const entries = projectEventsToTimeline([
			createEvent({ type: 'user_message', payload: { content: 42 } }),
		])

		expect(entries).toEqual([])
	})

	it('projects thinking and response from model output', () => {
		const entries = projectEventsToTimeline([
			createEvent({
				type: 'model_output_received',
				payload: { thinking: 'Hmm', response: 'Done' },
			}),
		])

		expect(entries).toEqual([
			{
				type: 'agent_thinking',
				id: 'event-1-thinking',
				projectId: 'project-1',
				text: 'Hmm',
			},
			{
				type: 'agent_response',
				id: 'event-1-response',
				projectId: 'project-1',
				text: 'Done',
			},
		])
	})

	it('ignores empty thinking and response values', () => {
		const entries = projectEventsToTimeline([
			createEvent({
				type: 'model_output_received',
				payload: { thinking: '', response: '' },
			}),
		])

		expect(entries).toEqual([])
	})

	it('projects tool call requests as started tool calls', () => {
		const entries = projectEventsToTimeline([
			createEvent({
				type: 'tool_call_requested',
				payload: {
					toolCallId: 'tc-1',
					toolId: 'bash',
					input: { command: 'ls' },
				},
			}),
		])

		expect(entries).toEqual([
			{
				type: 'agent_tool_call',
				id: 'tool-tc-1-started',
				projectId: 'project-1',
				tool: 'bash',
				status: 'started',
				input: '{"command":"ls"}',
			},
		])
	})

	it('ignores tool call requests without identifiers', () => {
		const entries = projectEventsToTimeline([
			createEvent({ type: 'tool_call_requested', payload: {} }),
		])

		expect(entries).toEqual([])
	})

	it('projects tool results as completed tool calls', () => {
		const entries = projectEventsToTimeline([
			createEvent({
				type: 'tool_result_produced',
				payload: {
					toolCallId: 'tc-1',
					toolId: 'bash',
					status: 'completed',
					output: 'ok',
					error: null,
				},
			}),
		])

		expect(entries).toEqual([
			{
				type: 'agent_tool_call',
				id: 'tool-tc-1-completed',
				projectId: 'project-1',
				tool: 'bash',
				status: 'completed',
				output: 'ok',
			},
		])
	})

	it('prefers the error message when a tool result fails', () => {
		const entries = projectEventsToTimeline([
			createEvent({
				type: 'tool_result_produced',
				payload: {
					toolCallId: 'tc-1',
					toolId: 'bash',
					status: 'error',
					output: null,
					error: 'boom',
				},
			}),
		])

		expect(entries[0]).toMatchObject({ output: 'boom' })
	})

	it('falls back to an unknown tool when the result has no tool id', () => {
		const entries = projectEventsToTimeline([
			createEvent({
				type: 'tool_result_produced',
				payload: { toolCallId: 'tc-1', output: 'ok' },
			}),
		])

		expect(entries[0]).toMatchObject({ tool: 'unknown' })
	})

	it('ignores unsupported events', () => {
		const entries = projectEventsToTimeline([
			createEvent({ type: 'turn_ended', payload: { reason: 'completed' } }),
		])

		expect(entries).toEqual([])
	})
})
