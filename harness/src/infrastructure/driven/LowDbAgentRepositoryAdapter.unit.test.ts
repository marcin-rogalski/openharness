import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { Agent } from '@/domain/Agent'
import LowDbAgentRepositoryAdapter from './LowDbAgentRepositoryAdapter'
import LowDbStore from './LowDbStore'

function makeAgent(overrides: Partial<Agent> = {}): Agent {
	return {
		id: 'agent-1',
		name: 'Test Agent',
		role: 'assistant',
		description: 'A test agent',
		tools: ['bash'],
		mcpAccess: [],
		memoryAccess: true,
		sandboxPolicy: { level: 'workspace-write', workspaceRoot: '/tmp' },
		budget: {
			id: 'budget-1',
			name: 'Default',
			tokenLimitPerTurn: 1000,
			tokenLimitPerSession: 10000,
			costLimitPerTurn: null,
			costLimitPerSession: null,
			enforcementPoint: 'pre_request',
		},
		modelPreferences: { provider: 'openai', model: 'gpt-4o-mini' },
		...overrides,
	}
}

describe('LowDbAgentRepositoryAdapter', () => {
	let dir: string
	let adapter: LowDbAgentRepositoryAdapter

	const setup = async () => {
		dir = mkdtempSync(join(tmpdir(), 'lowdb-agent-'))
		const store = new LowDbStore(join(dir, 'data.json'))
		await store.init()
		adapter = new LowDbAgentRepositoryAdapter(store)
	}

	const teardown = () => {
		rmSync(dir, { recursive: true, force: true })
	}

	it('returns empty list initially', async () => {
		await setup()
		expect(await adapter.list()).toEqual([])
		teardown()
	})

	it('creates and retrieves an agent', async () => {
		await setup()
		const agent = makeAgent()
		await adapter.create(agent)

		expect(await adapter.get('agent-1')).toEqual(agent)
		expect(await adapter.list()).toHaveLength(1)
		teardown()
	})

	it('returns null for non-existent agent', async () => {
		await setup()
		expect(await adapter.get('missing')).toBeNull()
		teardown()
	})

	it('updates an existing agent', async () => {
		await setup()
		const agent = makeAgent()
		await adapter.create(agent)

		const updated = makeAgent({ name: 'Updated' })
		await adapter.update('agent-1', updated)

		expect(await adapter.get('agent-1')).toEqual(updated)
		teardown()
	})

	it('throws when updating non-existent agent', async () => {
		await setup()
		await expect(adapter.update('missing', makeAgent())).rejects.toThrow(
			'Agent not found: missing',
		)
		teardown()
	})

})
