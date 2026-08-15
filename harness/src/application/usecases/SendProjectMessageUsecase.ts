import type { AgentRuntimePort } from '@/application/ports/adapters/AgentRuntimePort'
import type { ProjectRepositoryPort } from '@/application/ports/adapters/ProjectRepositoryPort'
import type {
	SendProjectMessageInput,
	SendProjectMessageOutput,
	SendProjectMessageUseCasePort,
} from '@/application/ports/usecases/SendProjectMessageUseCasePort'
import { SendProjectMessageInputSchema } from '@/application/ports/usecases/SendProjectMessageUseCasePort'
import type { AgentTimelineEntry } from '@/domain/AgentTimelineEntry'
import { ProjectNotFoundError } from '@/domain/ProjectNotFoundError'

export default class SendProjectMessageUsecase
	implements SendProjectMessageUseCasePort
{
	constructor(
		private readonly projects: ProjectRepositoryPort,
		private readonly agentRuntime: AgentRuntimePort,
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

		const userEntry: AgentTimelineEntry = {
			type: 'user_message',
			id: crypto.randomUUID(),
			projectId: project.id,
			content,
		}
		const agentEntries = await this.agentRuntime.handle({
			projectId: project.id,
			content,
		})

		return { entries: [userEntry, ...agentEntries] }
	}
}
