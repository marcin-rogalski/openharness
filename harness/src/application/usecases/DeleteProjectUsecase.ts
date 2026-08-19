import type { ProjectRepositoryPort } from '@/application/ports/adapters/ProjectRepositoryPort'
import type { SessionRepositoryPort } from '@/application/ports/adapters/SessionRepositoryPort'
import type {
	DeleteProjectInput,
	DeleteProjectOutput,
	DeleteProjectUseCasePort,
} from '@/application/ports/usecases/DeleteProjectUseCasePort'
import { DeleteProjectInputSchema } from '@/application/ports/usecases/DeleteProjectUseCasePort'
import { ProjectNotFoundError } from '@/domain/ProjectNotFoundError'

export default class DeleteProjectUsecase implements DeleteProjectUseCasePort {
	constructor(
		private readonly projects: ProjectRepositoryPort,
		private readonly sessions: SessionRepositoryPort,
	) {}

	async handle(input: DeleteProjectInput): Promise<DeleteProjectOutput> {
		const parsed = DeleteProjectInputSchema.parse(input)
		const project = await this.projects.findById(parsed.projectId)

		if (!project) {
			throw new ProjectNotFoundError(parsed.projectId)
		}

		const projectSessions = await this.sessions.listByProjectId(project.id)
		for (const session of projectSessions) {
			await this.sessions.delete(session.id)
		}

		await this.projects.delete(project.id)

		return { ok: true }
	}
}
