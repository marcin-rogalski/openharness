import type { EventLogPort } from '@/application/ports/adapters/EventLogPort'
import type { SessionRepositoryPort } from '@/application/ports/adapters/SessionRepositoryPort'
import type {
	ListSessionsInput,
	ListSessionsOutput,
	ListSessionsUseCasePort,
	SessionSummary,
} from '@/application/ports/usecases/ListSessionsUseCasePort'
import { ListSessionsInputSchema } from '@/application/ports/usecases/ListSessionsUseCasePort'

export default class ListSessionsUsecase implements ListSessionsUseCasePort {
	constructor(
		private readonly sessions: SessionRepositoryPort,
		private readonly eventLog: EventLogPort,
	) {}

	async handle(input: ListSessionsInput): Promise<ListSessionsOutput> {
		const parsed = ListSessionsInputSchema.parse(input)
		const sessionList = await this.sessions.listByProjectId(parsed.projectId)

		const summaries: SessionSummary[] = await Promise.all(
			sessionList.map(async (session) => {
				const events = await this.eventLog.listBySession(session.id)
				return {
					id: session.id,
					projectId: session.projectId,
					status: session.status,
					createdAt: session.createdAt,
					endedAt: session.endedAt,
					eventCount: events.length,
					lastEventAt:
						events.length > 0 ? events[events.length - 1].timestamp : null,
				}
			}),
		)

		return { sessions: summaries }
	}
}
