import { describe, expect, it } from 'vitest'
import EventProjectionService from './EventProjectionService'
import type { SessionEvent } from '@/domain/SessionEvent'

function createEvent(overrides: Partial<SessionEvent> = {}): SessionEvent {
	return {
		id: crypto.randomUUID(),
		sessionId: 'session-1',
		projectId: 'project-1',
		turnId: null,
		stepId: null,
		timestamp: '2026-01-01T00:00:00Z',
		actor: 'user',
		type: 'user_message',
		payload: { content: 'test' },
		visibility: 'both',
		...overrides,
	}
}

describe('EventProjectionService', () => {
	it('projects user_message events to user_message timeline entries', () => {
		const service = new EventProjectionService()
		const events = [
			createEvent({
				id: 'e1',
				type: 'user_message',
				payload: { content: 'Hello' },
			}),
		]

		const timeline = service.projectTimeline(events)

		expect(timeline).toEqual([
			{
				type: 'user_message',
				id: 'e1',
				projectId: 'project-1',
				content: 'Hello',
			},
		])
	})

	it('projects model_output_received events to thinking, tool, and response entries', () => {
		const service = new EventProjectionService()
		const events = [
			createEvent({
				id: 'e1',
				type: 'model_output_received',
				actor: 'agent',
				payload: {
					thinking: 'Let me think',
					toolCalls: [
						{ tool: 'read', input: 'file.txt', output: 'content' },
					],
					response: 'Done',
				},
			}),
		]

		const timeline = service.projectTimeline(events)

		expect(timeline.map((entry) => entry.type)).toEqual([
			'agent_thinking',
			'agent_tool_call',
			'agent_tool_call',
			'agent_response',
		])
		expect(timeline[0]).toMatchObject({ text: 'Let me think' })
		expect(timeline[1]).toMatchObject({
			tool: 'read',
			status: 'started',
			input: 'file.txt',
		})
		expect(timeline[2]).toMatchObject({
			tool: 'read',
			status: 'completed',
			output: 'content',
		})
		expect(timeline[3]).toMatchObject({ text: 'Done' })
	})

	it('omits thinking entry when thinking is null', () => {
		const service = new EventProjectionService()
		const events = [
			createEvent({
				id: 'e1',
				type: 'model_output_received',
				actor: 'agent',
				payload: {
					thinking: null,
					toolCalls: [],
					response: 'Just a response',
				},
			}),
		]

		const timeline = service.projectTimeline(events)

		expect(timeline.map((entry) => entry.type)).toEqual(['agent_response'])
	})

	it('omits tool entries when there are no tool calls', () => {
		const service = new EventProjectionService()
		const events = [
			createEvent({
				id: 'e1',
				type: 'model_output_received',
				actor: 'agent',
				payload: {
					thinking: null,
					toolCalls: [],
					response: 'No tools',
				},
			}),
		]

		const timeline = service.projectTimeline(events)

		expect(timeline).toHaveLength(1)
		expect(timeline[0].type).toBe('agent_response')
	})

	it('ignores event types that have no timeline projection', () => {
		const service = new EventProjectionService()
		const events = [
			createEvent({
				id: 'e1',
				type: 'session_created',
				actor: 'system',
				payload: { projectId: 'project-1' },
			}),
		]

		const timeline = service.projectTimeline(events)

		expect(timeline).toEqual([])
	})

	it('projects multiple events in order', () => {
		const service = new EventProjectionService()
		const events = [
			createEvent({
				id: 'e1',
				type: 'user_message',
				payload: { content: 'Hello' },
			}),
			createEvent({
				id: 'e2',
				type: 'model_output_received',
				actor: 'agent',
				payload: {
					thinking: null,
					toolCalls: [],
					response: 'Hi',
				},
			}),
			createEvent({
				id: 'e3',
				type: 'user_message',
				payload: { content: 'Again' },
			}),
		]

		const timeline = service.projectTimeline(events)

		expect(timeline.map((entry) => entry.type)).toEqual([
			'user_message',
			'agent_response',
			'user_message',
		])
	})
})
