import type { EventLogPort } from '@/application/ports/adapters/EventLogPort'
import type { SessionEvent } from '@/domain/SessionEvent'

export default class InMemoryEventLogAdapter implements EventLogPort {
	private readonly eventsBySession = new Map<string, SessionEvent[]>()

	async append(event: SessionEvent): Promise<void> {
		const existing = this.eventsBySession.get(event.sessionId) ?? []
		this.eventsBySession.set(event.sessionId, [...existing, event])
	}

	async listBySession(sessionId: string): Promise<SessionEvent[]> {
		return this.eventsBySession.get(sessionId) ?? []
	}
}
