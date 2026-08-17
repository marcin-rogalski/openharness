import type { AgentRuntimePort } from '@/application/ports/adapters/AgentRuntimePort'
import type { EventLogPort } from '@/application/ports/adapters/EventLogPort'
import type { ProjectRepositoryPort } from '@/application/ports/adapters/ProjectRepositoryPort'
import type { SessionRepositoryPort } from '@/application/ports/adapters/SessionRepositoryPort'
import type {
	SendProjectMessageInput,
	SendProjectMessageOutput,
	SendProjectMessageUseCasePort,
} from '@/application/ports/usecases/SendProjectMessageUseCasePort'
import { SendProjectMessageInputSchema } from '@/application/ports/usecases/SendProjectMessageUseCasePort'
import SessionContextService from '@/application/services/SessionContextService'
import type { Session } from '@/domain/Session'
import type { SessionEvent } from '@/domain/SessionEvent'
import { ProjectNotFoundError } from '@/domain/ProjectNotFoundError'

export default class SendProjectMessageUsecase
	implements SendProjectMessageUseCasePort
{
	private readonly contextService: SessionContextService

	constructor(
		private readonly projects: ProjectRepositoryPort,
		private readonly sessions: SessionRepositoryPort,
		private readonly eventLog: EventLogPort,
		private readonly agentRuntime: AgentRuntimePort,
	) {
		this.contextService = new SessionContextService()
	}

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

		const allEvents = await this.eventLog.listBySession(session.id)
		const context = this.contextService.deriveContext(allEvents)

		const agentResponse = await this.agentRuntime.handle({
			sessionId: session.id,
			projectId: project.id,
			context,
		})

		const modelEvent: SessionEvent = {
			id: crypto.randomUUID(),
			sessionId: session.id,
			projectId: project.id,
			turnId: null,
			stepId: null,
			timestamp: new Date().toISOString(),
			actor: 'agent',
			type: 'model_output_received',
			payload: {
				thinking: agentResponse.thinking,
				toolCalls: agentResponse.toolCalls,
				response: agentResponse.response,
			},
			visibility: 'both',
		}
		await this.eventLog.append(modelEvent)
		newEvents.push(modelEvent)

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
