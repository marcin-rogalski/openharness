import type { Agent } from '@/domain/Agent'

export interface ListAgentsOutput {
	agents: Agent[]
}

export interface CreateAgentInput {
	agent: Agent
}

export interface CreateAgentOutput {
	agent: Agent
}

export interface UpdateAgentInput {
	id: string
	agent: Agent
}

export interface UpdateAgentOutput {
	agent: Agent
}

export interface AgentUsecasePort {
	list(): Promise<ListAgentsOutput>
	create(input: CreateAgentInput): Promise<CreateAgentOutput>
	update(input: UpdateAgentInput): Promise<UpdateAgentOutput>
}
