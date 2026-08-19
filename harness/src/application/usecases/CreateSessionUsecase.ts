import { randomUUID } from 'node:crypto'
import type { EventLogPort } from '@/application/ports/adapters/EventLogPort'
import type { ProjectRepositoryPort } from '@/application/ports/adapters/ProjectRepositoryPort'
import type { SessionRepositoryPort } from '@/application/ports/adapters/SessionRepositoryPort'
import type {
	CreateSessionInput,
	CreateSessionOutput,
	CreateSessionUseCasePort,
} from '@/application/ports/usecases/CreateSessionUseCasePort'
import { CreateSessionInputSchema } from '@/application/ports/usecases/CreateSessionUseCasePort'
import { ProjectNotFoundError } from '@/domain/ProjectNotFoundError'
import type { Session } from '@/domain/Session'
import type { SessionEvent } from '@/domain/SessionEvent'

export default class CreateSessionUsecase implements CreateSessionUseCasePort {
	constructor(
		private readonly projects: ProjectRepositoryPort,
		private readonly sessions: SessionRepositoryPort,
		private readonly eventLog: EventLogPort,
	) {}

	async handle(input: CreateSessionInput): Promise<CreateSessionOutput> {
		const parsed = CreateSessionInputSchema.parse(input)
		const project = await this.projects.findById(parsed.projectId)

		if (!project) {
			throw new ProjectNotFoundError(parsed.projectId)
		}

		const session: Session = {
			id: randomUUID(),
			projectId: project.id,
			status: 'active',
			createdAt: new Date().toISOString(),
			endedAt: null,
		}
		await this.sessions.save(session)

		const createdEvent: SessionEvent = {
			id: randomUUID(),
			sessionId: session.id,
			projectId: project.id,
			turnId: null,
			stepId: null,
			timestamp: new Date().toISOString(),
			actor: 'system',
			type: 'session_created',
			payload: { projectId: project.id },
			visibility: 'user',
		}
		await this.eventLog.append(createdEvent)

		return { session }
	}
}
