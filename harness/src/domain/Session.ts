export type SessionStatus = 'active' | 'ended'

export interface Session {
	id: string
	projectId: string
	status: SessionStatus
	createdAt: string
	endedAt: string | null
}
