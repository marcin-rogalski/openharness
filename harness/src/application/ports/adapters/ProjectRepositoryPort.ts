import type { Project } from '@/domain/Project'

export interface ProjectRepositoryPort {
	findById(id: string): Promise<Project | null>
	list(): Promise<Project[]>
}
