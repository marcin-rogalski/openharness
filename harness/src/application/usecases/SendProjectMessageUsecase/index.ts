import type { EventLogPort } from '@/application/ports/adapters/EventLogPort'
import type { ProjectRepositoryPort } from '@/application/ports/adapters/ProjectRepositoryPort'
import type { SessionRepositoryPort } from '@/application/ports/adapters/SessionRepositoryPort'
import type {
	SendProjectMessageInput,
	SendProjectMessageOutput,
	SendProjectMessageUseCasePort,
} from '@/application/ports/usecases/SendProjectMessageUseCasePort'
import { SendProjectMessageInputSchema } from '@/application/ports/usecases/SendProjectMessageUseCasePort'
import type AgentLoopService from '@/application/services/AgentLoopService'
import ActiveTurnRegistry from '@/application/services/ActiveTurnRegistry'
import { DEFAULT_AGENT_LOOP_CONFIG } from '@/domain/AgentLoopConfig'
import { ProjectNotFoundError } from '@/domain/ProjectNotFoundError'
import type { Session } from '@/domain/Session'
import type { SessionEvent } from '@/domain/SessionEvent'

export default class SendProjectMessageUsecase
	implements SendProjectMessageUseCasePort
{
	constructor(
		private readonly projects: ProjectRepositoryPort,
		private readonly sessions: SessionRepositoryPort,
		private readonly eventLog: EventLogPort,
		private readonly agentLoop: AgentLoopService,
		private readonly activeTurns: ActiveTurnRegistry,
	) {}

	async handle(
		input: SendProjectMessageInput,
	): Promise<SendProjectMessageOutput> {
		const parsed = SendProjectMessageInputSchema.parse(input)
		const content = parsed.content.trim()
		const project = await this.projects.findById(parsed.projectId)

		if (!project) {
			throw new ProjectNotFoundError(parsed.projectId)
		}

		const { session, createdEvents } = await this.resolveSession(project.id)
		const newEvents: SessionEvent[] = [...createdEvents]

		const userEvent: SessionEvent = {
			id: crypto.randomUUID(),
			sessionId: session.id,
			projectId: project.id,
			turnId: null,
			stepId: null,
			timestamp: new Date().toISOString(),
			actor: 'user',
			type: 'user_message',
			payload: { content },
			visibility: 'both',
		}
		await this.eventLog.append(userEvent)
		newEvents.push(userEvent)

		const turnId = crypto.randomUUID()
		const controller = new AbortController()
		this.activeTurns.register(session.id, controller)
		void this.agentLoop
			.run({
				sessionId: session.id,
				projectId: project.id,
				turnId,
				config: DEFAULT_AGENT_LOOP_CONFIG,
				abortSignal: controller.signal,
			})
			.catch(() => {})
			.finally(() => {
				this.activeTurns.unregister(session.id)
			})

		return { sessionId: session.id, events: newEvents }
	}

	private async resolveSession(
		projectId: string,
	): Promise<{ session: Session; createdEvents: SessionEvent[] }> {
		const existing = await this.sessions.findActiveByProjectId(projectId)
		if (existing) {
			return { session: existing, createdEvents: [] }
		}

		const session: Session = {
			id: crypto.randomUUID(),
			projectId,
			status: 'active',
			createdAt: new Date().toISOString(),
			endedAt: null,
		}
		await this.sessions.save(session)

		const createdEvent: SessionEvent = {
			id: crypto.randomUUID(),
			sessionId: session.id,
			projectId,
			turnId: null,
			stepId: null,
			timestamp: new Date().toISOString(),
			actor: 'system',
			type: 'session_created',
			payload: { projectId },
			visibility: 'user',
		}
		await this.eventLog.append(createdEvent)

		return { session, createdEvents: [createdEvent] }
	}
}
