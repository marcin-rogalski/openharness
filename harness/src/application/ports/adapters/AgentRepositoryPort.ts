import type { Agent } from '@/domain/Agent'

export interface AgentRepositoryPort {
	list(): Promise<Agent[]>
	get(id: string): Promise<Agent | null>
	create(agent: Agent): Promise<Agent>
	update(id: string, agent: Agent): Promise<Agent>
}
