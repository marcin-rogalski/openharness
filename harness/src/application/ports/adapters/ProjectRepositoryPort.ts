import type { Project } from '@/domain/Project'

export interface ProjectRepositoryPort {
	findById(id: string): Promise<Project | null>
	list(): Promise<Project[]>
	save(project: Project): Promise<void>
	delete(id: string): Promise<void>
}
