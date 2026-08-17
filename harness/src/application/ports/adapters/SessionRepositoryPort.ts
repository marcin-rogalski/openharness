import type { Session } from '@/domain/Session'

export interface SessionRepositoryPort {
	findById(id: string): Promise<Session | null>
	findActiveByProjectId(projectId: string): Promise<Session | null>
	save(session: Session): Promise<void>
}
