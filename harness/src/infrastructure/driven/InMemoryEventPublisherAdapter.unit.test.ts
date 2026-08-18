import { describe, expect, it, vi } from 'vitest'
import type { SessionEvent } from '@/domain/SessionEvent'
import InMemoryEventPublisherAdapter from './InMemoryEventPublisherAdapter'

function makeEvent(overrides: Partial<SessionEvent> = {}): SessionEvent {
	return {
		id: 'event-1',
		sessionId: 'session-1',
		projectId: 'project-1',
		turnId: null,
		stepId: null,
		timestamp: '2025-01-01T00:00:00Z',
		actor: 'system',
		type: 'session_created',
		payload: {},
		visibility: 'both',
		...overrides,
	}
}

describe('InMemoryEventPublisherAdapter', () => {
	it('delivers events to subscribed listeners', () => {
		const publisher = new InMemoryEventPublisherAdapter()
		const listener = vi.fn()
		publisher.subscribe('session-1', listener)

		publisher.publish(makeEvent())

		expect(listener).toHaveBeenCalledWith(
			expect.objectContaining({ id: 'event-1' }),
		)
	})

	it('does not deliver events to unsubscribed sessions', () => {
		const publisher = new InMemoryEventPublisherAdapter()
		const listener = vi.fn()
		publisher.subscribe('session-1', listener)
		publisher.unsubscribe('session-1', listener)

		publisher.publish(makeEvent())

		expect(listener).not.toHaveBeenCalled()
	})

	it('delivers to multiple listeners on the same session', () => {
		const publisher = new InMemoryEventPublisherAdapter()
		const listener1 = vi.fn()
		const listener2 = vi.fn()
		publisher.subscribe('session-1', listener1)
		publisher.subscribe('session-1', listener2)

		publisher.publish(makeEvent())

		expect(listener1).toHaveBeenCalled()
		expect(listener2).toHaveBeenCalled()
	})

	it('does not deliver events to different sessions', () => {
		const publisher = new InMemoryEventPublisherAdapter()
		const listener = vi.fn()
		publisher.subscribe('session-1', listener)

		publisher.publish(makeEvent({ sessionId: 'session-2' }))

		expect(listener).not.toHaveBeenCalled()
	})

	it('publish without subscribers does not throw', () => {
		const publisher = new InMemoryEventPublisherAdapter()
		expect(() => publisher.publish(makeEvent())).not.toThrow()
	})
})
