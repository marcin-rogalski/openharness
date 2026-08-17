import { describe, expect, it } from 'vitest'
import type { SessionEvent } from '@/domain/SessionEvent'
import SessionContextService from './SessionContextService'

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

describe('SessionContextService', () => {
	it('derives user messages from user_message events', () => {
		const service = new SessionContextService()
		const events = [
			createEvent({
				type: 'user_message',
				payload: { content: 'Hello' },
				visibility: 'both',
			}),
		]

		const context = service.deriveContext(events)

		expect(context).toEqual([{ role: 'user', content: 'Hello' }])
	})

	it('derives assistant messages from model_output_received events', () => {
		const service = new SessionContextService()
		const events = [
			createEvent({
				type: 'model_output_received',
				actor: 'agent',
				payload: { response: 'Hi there' },
				visibility: 'both',
			}),
		]

		const context = service.deriveContext(events)

		expect(context).toEqual([{ role: 'assistant', content: 'Hi there' }])
	})

	it('includes toolCalls in assistant message when present', () => {
		const service = new SessionContextService()
		const events = [
			createEvent({
				type: 'model_output_received',
				actor: 'agent',
				payload: {
					response: '',
					toolCalls: [
						{ id: 'call-1', tool: 'read_file', input: '{"path":"/tmp"}' },
					],
				},
				visibility: 'both',
			}),
		]

		const context = service.deriveContext(events)

		expect(context).toEqual([
			{
				role: 'assistant',
				content: '',
				toolCalls: [{ id: 'call-1', tool: 'read_file', input: '{"path":"/tmp"}' }],
			},
		])
	})

	it('derives tool results from tool_result_produced events', () => {
		const service = new SessionContextService()
		const events = [
			createEvent({
				type: 'tool_result_produced',
				actor: 'agent',
				payload: {
					toolCallId: 'call-1',
					status: 'success',
					output: 'file contents',
					error: null,
				},
				visibility: 'both',
			}),
		]

		const context = service.deriveContext(events)

		expect(context).toEqual([
			{ role: 'tool', toolCallId: 'call-1', content: '"file contents"' },
		])
	})

	it('derives tool error results from tool_result_produced events', () => {
		const service = new SessionContextService()
		const events = [
			createEvent({
				type: 'tool_result_produced',
				actor: 'agent',
				payload: {
					toolCallId: 'call-2',
					status: 'error',
					output: null,
					error: 'File not found',
				},
				visibility: 'both',
			}),
		]

		const context = service.deriveContext(events)

		expect(context).toEqual([
			{ role: 'tool', toolCallId: 'call-2', content: 'Error: File not found' },
		])
	})

	it('excludes events with user-only visibility', () => {
		const service = new SessionContextService()
		const events = [
			createEvent({
				type: 'user_message',
				payload: { content: 'Hidden' },
				visibility: 'user',
			}),
		]

		const context = service.deriveContext(events)

		expect(context).toEqual([])
	})

	it('includes events with model-only visibility', () => {
		const service = new SessionContextService()
		const events = [
			createEvent({
				type: 'user_message',
				payload: { content: 'For model' },
				visibility: 'model',
			}),
		]

		const context = service.deriveContext(events)

		expect(context).toEqual([{ role: 'user', content: 'For model' }])
	})

	it('ignores event types that are not part of the model context', () => {
		const service = new SessionContextService()
		const events = [
			createEvent({
				type: 'session_created',
				actor: 'system',
				payload: { projectId: 'project-1' },
				visibility: 'both',
			}),
		]

		const context = service.deriveContext(events)

		expect(context).toEqual([])
	})

	it('preserves event order in the derived context', () => {
		const service = new SessionContextService()
		const events = [
			createEvent({
				id: 'e1',
				type: 'user_message',
				payload: { content: 'First' },
				visibility: 'both',
			}),
			createEvent({
				id: 'e2',
				type: 'model_output_received',
				actor: 'agent',
				payload: { response: 'First response' },
				visibility: 'both',
			}),
			createEvent({
				id: 'e3',
				type: 'user_message',
				payload: { content: 'Second' },
				visibility: 'both',
			}),
		]

		const context = service.deriveContext(events)

		expect(context).toEqual([
			{ role: 'user', content: 'First' },
			{ role: 'assistant', content: 'First response' },
			{ role: 'user', content: 'Second' },
		])
	})
})
