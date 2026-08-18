import { describe, expect, it, vi } from 'vitest'
import type { EventLogPort } from '@/application/ports/adapters/EventLogPort'
import type { EventPublisherPort } from '@/application/ports/adapters/EventPublisherPort'
import type { SessionEvent } from '@/domain/SessionEvent'
import PublishingEventLogAdapter from './PublishingEventLogAdapter'

function makeEvent(): SessionEvent {
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
	}
}

describe('PublishingEventLogAdapter', () => {
	it('delegates append to inner log and publishes the event', async () => {
		const inner: EventLogPort = {
			append: vi.fn().mockResolvedValue(undefined),
			listBySession: vi.fn().mockResolvedValue([]),
		}
		const publisher: EventPublisherPort = {
			publish: vi.fn(),
			subscribe: vi.fn(),
			unsubscribe: vi.fn(),
		}

		const adapter = new PublishingEventLogAdapter(inner, publisher)
		const event = makeEvent()

		await adapter.append(event)

		expect(inner.append).toHaveBeenCalledWith(event)
		expect(publisher.publish).toHaveBeenCalledWith(event)
	})

	it('delegates listBySession to inner log', async () => {
		const events = [makeEvent()]
		const inner: EventLogPort = {
			append: vi.fn(),
			listBySession: vi.fn().mockResolvedValue(events),
		}
		const publisher: EventPublisherPort = {
			publish: vi.fn(),
			subscribe: vi.fn(),
			unsubscribe: vi.fn(),
		}

		const adapter = new PublishingEventLogAdapter(inner, publisher)
		const result = await adapter.listBySession('session-1')

		expect(result).toEqual(events)
		expect(inner.listBySession).toHaveBeenCalledWith('session-1')
	})
})
