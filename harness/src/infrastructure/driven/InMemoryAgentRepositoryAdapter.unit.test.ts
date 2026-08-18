import { describe, expect, it } from 'vitest'
import InMemoryAgentRepositoryAdapter from './InMemoryAgentRepositoryAdapter'
import type { Agent } from '@/domain/Agent'

const agent: Agent = {
	id: 'a1',
	name: 'Coder',
	role: 'developer',
	description: 'Writes code',
	tools: ['read'],
	mcpAccess: [],
	memoryAccess: true,
	sandboxPolicy: { level: 'workspace-write', workspaceRoot: '/tmp' },
	budget: {
		id: 'b1',
		name: 'Default',
		tokenLimitPerTurn: 1000,
		tokenLimitPerSession: 10000,
		costLimitPerTurn: null,
		costLimitPerSession: null,
		enforcementPoint: 'pre_request',
	},
	modelPreferences: { provider: 'openai', model: 'gpt-4o-mini' },
}

describe('InMemoryAgentRepositoryAdapter', () => {
	it('returns a stored agent', async () => {
		const repo = new InMemoryAgentRepositoryAdapter()
		await repo.create(agent)

		await expect(repo.get('a1')).resolves.toEqual(agent)
	})

	it('returns null when the agent is missing', async () => {
		const repo = new InMemoryAgentRepositoryAdapter()

		await expect(repo.get('missing')).resolves.toBeNull()
	})

	it('lists all stored agents', async () => {
		const repo = new InMemoryAgentRepositoryAdapter()
		await repo.create(agent)

		await expect(repo.list()).resolves.toEqual([agent])
	})

	it('creates an agent', async () => {
		const repo = new InMemoryAgentRepositoryAdapter()

		await expect(repo.create(agent)).resolves.toEqual(agent)
	})

	it('updates an existing agent', async () => {
		const repo = new InMemoryAgentRepositoryAdapter()
		await repo.create(agent)
		const updated = { ...agent, name: 'Updated' }

		await expect(repo.update('a1', updated)).resolves.toEqual(updated)
	})

	it('throws when updating a missing agent', async () => {
		const repo = new InMemoryAgentRepositoryAdapter()

		await expect(repo.update('missing', agent)).rejects.toThrow(
			'Agent not found: missing',
		)
	})
})
