import type { SessionEvent } from '@/domain/SessionEvent'

export type EventListener = (event: SessionEvent) => void

export interface EventPublisherPort {
	publish(event: SessionEvent): void
	subscribe(sessionId: string, listener: EventListener): void
	unsubscribe(sessionId: string, listener: EventListener): void
}
