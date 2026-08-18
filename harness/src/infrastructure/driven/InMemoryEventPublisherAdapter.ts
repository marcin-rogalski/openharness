import type {
	EventListener,
	EventPublisherPort,
} from '@/application/ports/adapters/EventPublisherPort'
import type { SessionEvent } from '@/domain/SessionEvent'

export default class InMemoryEventPublisherAdapter
	implements EventPublisherPort
{
	private readonly listeners = new Map<string, Set<EventListener>>()

	publish(event: SessionEvent): void {
		const sessionListeners = this.listeners.get(event.sessionId)
		if (!sessionListeners) return
		for (const listener of sessionListeners) {
			listener(event)
		}
	}

	subscribe(sessionId: string, listener: EventListener): void {
		let sessionListeners = this.listeners.get(sessionId)
		if (!sessionListeners) {
			sessionListeners = new Set()
			this.listeners.set(sessionId, sessionListeners)
		}
		sessionListeners.add(listener)
	}

	unsubscribe(sessionId: string, listener: EventListener): void {
		const sessionListeners = this.listeners.get(sessionId)
		if (!sessionListeners) return
		sessionListeners.delete(listener)
		if (sessionListeners.size === 0) {
			this.listeners.delete(sessionId)
		}
	}
}
