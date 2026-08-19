import type { SessionRepositoryPort } from '@/application/ports/adapters/SessionRepositoryPort'
import type { Session } from '@/domain/Session'

export default class InMemorySessionRepositoryAdapter
	implements SessionRepositoryPort
{
	private readonly sessions = new Map<string, Session>()

	async findById(id: string): Promise<Session | null> {
		return this.sessions.get(id) ?? null
	}

	async findActiveByProjectId(projectId: string): Promise<Session | null> {
		for (const session of this.sessions.values()) {
			if (session.projectId === projectId && session.status === 'active') {
				return session
			}
		}
		return null
	}

	async listByProjectId(projectId: string): Promise<Session[]> {
		return [...this.sessions.values()].filter((s) => s.projectId === projectId)
	}

	async save(session: Session): Promise<void> {
		this.sessions.set(session.id, session)
	}
}
