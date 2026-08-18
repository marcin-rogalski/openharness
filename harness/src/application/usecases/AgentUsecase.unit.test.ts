import { describe, expect, it } from 'vitest'
import AgentUsecase from '@/application/usecases/AgentUsecase'
import InMemoryAgentRepositoryAdapter from '@/infrastructure/driven/InMemoryAgentRepositoryAdapter'
import type { Agent } from '@/domain/Agent'
import type { Budget } from '@/domain/Budget'

function makeBudget(): Budget {
	return {
		id: 'budget-1',
		name: 'default',
		tokenLimitPerTurn: 1000,
		tokenLimitPerSession: null,
		costLimitPerTurn: null,
		costLimitPerSession: null,
		enforcementPoint: 'pre_request',
	}
}

function makeAgent(overrides: Partial<Agent> = {}): Agent {
	return {
		id: 'agent-1',
		name: 'test-agent',
		role: 'coder',
		description: 'A test agent',
		tools: ['bash', 'read'],
		mcpAccess: [],
		memoryAccess: true,
		sandboxPolicy: { level: 'workspace-write', workspaceRoot: '/tmp' },
		budget: makeBudget(),
		modelPreferences: { provider: 'local', model: 'qwen' },
		...overrides,
	}
}

describe('AgentUsecase', () => {
	it('lists agents', async () => {
		const repo = new InMemoryAgentRepositoryAdapter()
		await repo.create(makeAgent())
		const usecase = new AgentUsecase(repo)
		const result = await usecase.list()
		expect(result.agents).toHaveLength(1)
		expect(result.agents[0].name).toBe('test-agent')
	})

	it('creates an agent', async () => {
		const repo = new InMemoryAgentRepositoryAdapter()
		const usecase = new AgentUsecase(repo)
		const agent = makeAgent()
		const result = await usecase.create({ agent })
		expect(result.agent.id).toBe('agent-1')
	})

	it('updates an agent', async () => {
		const repo = new InMemoryAgentRepositoryAdapter()
		await repo.create(makeAgent())
		const usecase = new AgentUsecase(repo)
		const updated = makeAgent({ name: 'updated' })
		const result = await usecase.update({ id: 'agent-1', agent: updated })
		expect(result.agent.name).toBe('updated')
	})

	it('throws when updating non-existent agent', async () => {
		const repo = new InMemoryAgentRepositoryAdapter()
		const usecase = new AgentUsecase(repo)
		await expect(usecase.update({ id: 'nope', agent: makeAgent() })).rejects.toThrow()
	})
})
