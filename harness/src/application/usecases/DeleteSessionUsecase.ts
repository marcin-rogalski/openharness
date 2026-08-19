import type { ProjectRepositoryPort } from '@/application/ports/adapters/ProjectRepositoryPort'
import type { SessionRepositoryPort } from '@/application/ports/adapters/SessionRepositoryPort'
import type {
	DeleteSessionInput,
	DeleteSessionOutput,
	DeleteSessionUseCasePort,
} from '@/application/ports/usecases/DeleteSessionUseCasePort'
import { DeleteSessionInputSchema } from '@/application/ports/usecases/DeleteSessionUseCasePort'
import { ProjectNotFoundError } from '@/domain/ProjectNotFoundError'
import { SessionNotFoundError } from '@/domain/SessionNotFoundError'

export default class DeleteSessionUsecase implements DeleteSessionUseCasePort {
	constructor(
		private readonly projects: ProjectRepositoryPort,
		private readonly sessions: SessionRepositoryPort,
	) {}

	async handle(input: DeleteSessionInput): Promise<DeleteSessionOutput> {
		const parsed = DeleteSessionInputSchema.parse(input)
		const project = await this.projects.findById(parsed.projectId)

		if (!project) {
			throw new ProjectNotFoundError(parsed.projectId)
		}

		const session = await this.sessions.findById(parsed.sessionId)

		if (!session || session.projectId !== project.id) {
			throw new SessionNotFoundError(parsed.sessionId)
		}

		await this.sessions.delete(session.id)

		return { ok: true }
	}
}
