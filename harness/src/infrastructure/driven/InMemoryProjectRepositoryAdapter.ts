import type { ProjectRepositoryPort } from '@/application/ports/adapters/ProjectRepositoryPort'
import type { Project } from '@/domain/Project'

export default class InMemoryProjectRepositoryAdapter
	implements ProjectRepositoryPort
{
	private readonly projects: Project[]

	constructor(projects: Project[] = []) {
		this.projects = projects
	}

	async findById(id: string): Promise<Project | null> {
		return this.projects.find((project) => project.id === id) ?? null
	}

	async list(): Promise<Project[]> {
		return [...this.projects]
	}

	async save(project: Project): Promise<void> {
		const index = this.projects.findIndex((p) => p.id === project.id)
		if (index === -1) {
			this.projects.push(project)
		} else {
			this.projects[index] = project
		}
	}

	async delete(id: string): Promise<void> {
		const index = this.projects.findIndex((p) => p.id === id)
		if (index !== -1) {
			this.projects.splice(index, 1)
		}
	}
}
