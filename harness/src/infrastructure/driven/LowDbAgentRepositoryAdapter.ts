import type { AgentRepositoryPort } from '@/application/ports/adapters/AgentRepositoryPort'
import type { Agent } from '@/domain/Agent'
import type LowDbStore from './LowDbStore'

export default class LowDbAgentRepositoryAdapter
	implements AgentRepositoryPort
{
	constructor(private readonly store: LowDbStore) {}

	async list(): Promise<Agent[]> {
		return [...this.store.db.data.agents]
	}

	async get(id: string): Promise<Agent | null> {
		return this.store.db.data.agents.find((a) => a.id === id) ?? null
	}

	async create(agent: Agent): Promise<Agent> {
		this.store.db.data.agents.push(agent)
		await this.store.persist()
		return agent
	}

	async update(id: string, agent: Agent): Promise<Agent> {
		const index = this.store.db.data.agents.findIndex((a) => a.id === id)
		if (index === -1) {
			throw new Error(`Agent not found: ${id}`)
		}
		this.store.db.data.agents[index] = agent
		await this.store.persist()
		return agent
	}
}
