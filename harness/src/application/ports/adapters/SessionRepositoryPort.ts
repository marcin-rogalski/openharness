import type { Session } from '@/domain/Session'

export interface SessionRepositoryPort {
	findById(id: string): Promise<Session | null>
	findActiveByProjectId(projectId: string): Promise<Session | null>
	listByProjectId(projectId: string): Promise<Session[]>
	save(session: Session): Promise<void>
	delete(id: string): Promise<void>
}
