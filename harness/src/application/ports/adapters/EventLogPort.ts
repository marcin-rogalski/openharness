import type { SessionEvent } from '@/domain/SessionEvent'

export interface EventLogPort {
	append(event: SessionEvent): Promise<void>
	listBySession(sessionId: string): Promise<SessionEvent[]>
}
