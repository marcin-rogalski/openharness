import type { EventLogPort } from '@/application/ports/adapters/EventLogPort'
import type { EventPublisherPort } from '@/application/ports/adapters/EventPublisherPort'
import type { SessionEvent } from '@/domain/SessionEvent'

export default class PublishingEventLogAdapter implements EventLogPort {
	constructor(
		private readonly inner: EventLogPort,
		private readonly publisher: EventPublisherPort,
	) {}

	async append(event: SessionEvent): Promise<void> {
		await this.inner.append(event)
		this.publisher.publish(event)
	}

	async listBySession(sessionId: string): Promise<SessionEvent[]> {
		return this.inner.listBySession(sessionId)
	}
}
