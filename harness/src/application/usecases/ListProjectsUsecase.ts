import type { ProjectRepositoryPort } from '@/application/ports/adapters/ProjectRepositoryPort'
import type {
	ListProjectsOutput,
	ListProjectsUseCasePort,
} from '@/application/ports/usecases/ListProjectsUseCasePort'

export default class ListProjectsUsecase implements ListProjectsUseCasePort {
	constructor(private readonly projects: ProjectRepositoryPort) {}

	async handle(): Promise<ListProjectsOutput> {
		return { projects: await this.projects.list() }
	}
}
