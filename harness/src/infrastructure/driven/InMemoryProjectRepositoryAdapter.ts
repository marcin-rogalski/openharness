import type { ProjectRepositoryPort } from '@/application/ports/adapters/ProjectRepositoryPort'
import type { Project } from '@/domain/Project'

export default class InMemoryProjectRepositoryAdapter
	implements ProjectRepositoryPort
{
	constructor(private readonly projects: Project[] = []) {}

	async findById(id: string): Promise<Project | null> {
		return this.projects.find((project) => project.id === id) ?? null
	}

	async list(): Promise<Project[]> {
		return [...this.projects]
	}
}
