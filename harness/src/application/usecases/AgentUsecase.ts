import type { AgentRepositoryPort } from '@/application/ports/adapters/AgentRepositoryPort'
import type {
	AgentUsecasePort,
	CreateAgentInput,
	CreateAgentOutput,
	ListAgentsOutput,
	UpdateAgentInput,
	UpdateAgentOutput,
} from '@/application/ports/usecases/AgentUsecasePort'

export default class AgentUsecase implements AgentUsecasePort {
	constructor(private readonly repository: AgentRepositoryPort) {}

	async list(): Promise<ListAgentsOutput> {
		return { agents: await this.repository.list() }
	}

	async create(input: CreateAgentInput): Promise<CreateAgentOutput> {
		return { agent: await this.repository.create(input.agent) }
	}

	async update(input: UpdateAgentInput): Promise<UpdateAgentOutput> {
		return { agent: await this.repository.update(input.id, input.agent) }
	}
}
