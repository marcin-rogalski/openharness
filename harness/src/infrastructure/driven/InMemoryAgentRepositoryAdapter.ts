import type { AgentRepositoryPort } from '@/application/ports/adapters/AgentRepositoryPort'
import type { Agent } from '@/domain/Agent'

export default class InMemoryAgentRepositoryAdapter implements AgentRepositoryPort {
	private readonly agents = new Map<string, Agent>()

	async list(): Promise<Agent[]> {
		return [...this.agents.values()]
	}

	async get(id: string): Promise<Agent | null> {
		return this.agents.get(id) ?? null
	}

	async create(agent: Agent): Promise<Agent> {
		this.agents.set(agent.id, agent)
		return agent
	}

	async update(id: string, agent: Agent): Promise<Agent> {
		if (!this.agents.has(id)) {
			throw new Error(`Agent not found: ${id}`)
		}
		this.agents.set(id, agent)
		return agent
	}
}
