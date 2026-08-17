import { describe, expect, it } from 'vitest'
import InMemoryEventLogAdapter from './InMemoryEventLogAdapter'
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

describe('InMemoryEventLogAdapter', () => {
	it('appends and lists events for a session', async () => {
		const log = new InMemoryEventLogAdapter()
		const event = createEvent()

		await log.append(event)

		const events = await log.listBySession('session-1')
		expect(events).toHaveLength(1)
		expect(events[0]).toEqual(event)
	})

	it('returns an empty array for an unknown session', async () => {
		const log = new InMemoryEventLogAdapter()

		await expect(log.listBySession('unknown')).resolves.toEqual([])
	})

	it('preserves append order', async () => {
		const log = new InMemoryEventLogAdapter()
		const first = createEvent({ id: 'first' })
		const second = createEvent({ id: 'second' })

		await log.append(first)
		await log.append(second)

		const events = await log.listBySession('session-1')
		expect(events.map((e) => e.id)).toEqual(['first', 'second'])
	})

	it('keeps events for different sessions separate', async () => {
		const log = new InMemoryEventLogAdapter()
		const event1 = createEvent({ sessionId: 'session-1' })
		const event2 = createEvent({ sessionId: 'session-2' })

		await log.append(event1)
		await log.append(event2)

		await expect(log.listBySession('session-1')).resolves.toHaveLength(1)
		await expect(log.listBySession('session-2')).resolves.toHaveLength(1)
	})
})
