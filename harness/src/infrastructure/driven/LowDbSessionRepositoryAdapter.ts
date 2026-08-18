import type { SessionRepositoryPort } from '@/application/ports/adapters/SessionRepositoryPort'
import type { Session } from '@/domain/Session'
import type LowDbStore from './LowDbStore'

export default class LowDbSessionRepositoryAdapter
	implements SessionRepositoryPort
{
	constructor(private readonly store: LowDbStore) {}

	async findById(id: string): Promise<Session | null> {
		return this.store.db.data.sessions.find((s) => s.id === id) ?? null
	}

	async findActiveByProjectId(projectId: string): Promise<Session | null> {
		return (
			this.store.db.data.sessions.find(
				(s) => s.projectId === projectId && s.status === 'active',
			) ?? null
		)
	}

	async save(session: Session): Promise<void> {
		const index = this.store.db.data.sessions.findIndex(
			(s) => s.id === session.id,
		)
		if (index === -1) {
			this.store.db.data.sessions.push(session)
		} else {
			this.store.db.data.sessions[index] = session
		}
		await this.store.persist()
	}
}
