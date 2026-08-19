import type { ProjectRepositoryPort } from '@/application/ports/adapters/ProjectRepositoryPort'
import type { SessionRepositoryPort } from '@/application/ports/adapters/SessionRepositoryPort'
import type {
	StopSessionInput,
	StopSessionOutput,
	StopSessionUseCasePort,
} from '@/application/ports/usecases/StopSessionUseCasePort'
import { StopSessionInputSchema } from '@/application/ports/usecases/StopSessionUseCasePort'
import type ActiveTurnRegistry from '@/application/services/ActiveTurnRegistry'
import { ProjectNotFoundError } from '@/domain/ProjectNotFoundError'
import { SessionNotFoundError } from '@/domain/SessionNotFoundError'

export default class StopSessionUsecase implements StopSessionUseCasePort {
	constructor(
		private readonly projects: ProjectRepositoryPort,
		private readonly sessions: SessionRepositoryPort,
		private readonly activeTurns: ActiveTurnRegistry,
	) {}

	async handle(input: StopSessionInput): Promise<StopSessionOutput> {
		const parsed = StopSessionInputSchema.parse(input)
		const project = await this.projects.findById(parsed.projectId)

		if (!project) {
			throw new ProjectNotFoundError(parsed.projectId)
		}

		const session = await this.sessions.findById(parsed.sessionId)

		if (!session || session.projectId !== parsed.projectId) {
			throw new SessionNotFoundError(parsed.sessionId)
		}

		this.activeTurns.abort(parsed.sessionId)

		return { ok: true }
	}
}
