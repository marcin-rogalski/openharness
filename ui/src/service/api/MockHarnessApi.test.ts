import { describe, expect, it } from 'vitest'
import type { Agent, Budget, Permission, Rule } from './HarnessApi'
import { createMockHarnessApi } from './MockHarnessApi'

const testAgent: Agent = {
	id: 'a1',
	name: 'Test Agent',
	role: 'coder',
	description: '',
	tools: [],
	mcpAccess: [],
	memoryAccess: false,
	sandboxPolicy: { level: 'workspace-write', workspaceRoot: '.' },
	budget: {
		id: 'b1',
		name: 'default',
		tokenLimitPerTurn: null,
		tokenLimitPerSession: null,
		costLimitPerTurn: null,
		costLimitPerSession: null,
		enforcementPoint: 'pre_request',
	},
	modelPreferences: { provider: 'openai', model: 'gpt-4o-mini' },
}

const testRule: Rule = {
	id: 'r1',
	name: 'Test Rule',
	when: 'tool_call',
	condition: {},
	action: 'deny',
	guard: null,
}

const testBudget: Budget = {
	id: 'b1',
	name: 'Test Budget',
	tokenLimitPerTurn: 1000,
	tokenLimitPerSession: null,
	costLimitPerTurn: null,
	costLimitPerSession: null,
	enforcementPoint: 'pre_request',
}

const testPermission: Permission = {
	id: 'p1',
	name: 'Test Permission',
	resource: 'tool',
	resourceId: 'bash',
	action: 'allow',
	scope: 'project',
	scopeId: null,
}

describe('createMockHarnessApi', () => {
	it('returns the mock projects', async () => {
		const api = createMockHarnessApi()

		await expect(api.listProjects()).resolves.toEqual([
			{ id: 'project-1', name: 'OpenHarness', status: 'running' },
			{ id: 'project-2', name: 'Tempo', status: 'idle' },
		])
	})

	it('returns a session id and events for the message', async () => {
		const api = createMockHarnessApi()

		const result = await api.sendMessage('project-1', '  Hello  ')

		expect(result.sessionId).toBeTypeOf('string')
		expect(result.events.map((event) => event.type)).toEqual([
			'user_message',
			'model_output_received',
			'tool_call_requested',
			'tool_result_produced',
			'model_output_received',
		])
		expect(result.events[0]).toMatchObject({
			projectId: 'project-1',
			payload: { content: 'Hello' },
		})
	})

	it('rejects empty content', async () => {
		const api = createMockHarnessApi()

		await expect(api.sendMessage('project-1', '   ')).rejects.toThrow(
			'content must not be empty',
		)
	})

	it('reports health', async () => {
		const api = createMockHarnessApi()

		await expect(api.health()).resolves.toBeUndefined()
	})

	it('reads and updates the mock harness config', async () => {
		const api = createMockHarnessApi()

		await expect(api.getConfig()).resolves.toEqual({
			schemaVersion: 1,
			port: 3000,
			projectsDir: '~/.openharness/projects',
			providers: {
				openai: {
					url: 'https://api.openai.com/v1',
					models: { 'gpt-4o-mini': { label: 'GPT-4o Mini' } },
				},
			},
			defaultModel: 'openai/gpt-4o-mini',
		})

		await expect(api.updateConfig({ port: 4000 })).resolves.toEqual({
			config: {
				schemaVersion: 1,
				port: 4000,
				projectsDir: '~/.openharness/projects',
				providers: {
					openai: {
						url: 'https://api.openai.com/v1',
						models: { 'gpt-4o-mini': { label: 'GPT-4o Mini' } },
					},
				},
				defaultModel: 'openai/gpt-4o-mini',
			},
			restartRequired: true,
		})

		await expect(api.getConfig()).resolves.toMatchObject({ port: 4000 })
	})

	it('creates and lists agents', async () => {
		const api = createMockHarnessApi()

		await expect(api.listAgents()).resolves.toEqual([])
		await expect(api.createAgent(testAgent)).resolves.toEqual(testAgent)
		await expect(api.listAgents()).resolves.toEqual([testAgent])
	})

	it('updates an agent', async () => {
		const api = createMockHarnessApi()
		await api.createAgent(testAgent)

		const updated: Agent = { ...testAgent, name: 'Updated' }
		await expect(api.updateAgent('a1', updated)).resolves.toEqual(updated)
		await expect(api.listAgents()).resolves.toEqual([updated])
	})

	it('throws when updating a non-existent agent', async () => {
		const api = createMockHarnessApi()

		await expect(api.updateAgent('nope', testAgent)).rejects.toThrow(
			'Agent not found: nope',
		)
	})

	it('creates and lists rules', async () => {
		const api = createMockHarnessApi()

		await expect(api.listRules()).resolves.toEqual([])
		await expect(api.createRule(testRule)).resolves.toEqual(testRule)
		await expect(api.listRules()).resolves.toEqual([testRule])
	})

	it('updates a rule', async () => {
		const api = createMockHarnessApi()
		await api.createRule(testRule)

		const updated: Rule = { ...testRule, name: 'Updated' }
		await expect(api.updateRule('r1', updated)).resolves.toEqual(updated)
	})

	it('throws when updating a non-existent rule', async () => {
		const api = createMockHarnessApi()

		await expect(api.updateRule('nope', testRule)).rejects.toThrow(
			'Rule not found: nope',
		)
	})

	it('creates and lists budgets', async () => {
		const api = createMockHarnessApi()

		await expect(api.listBudgets()).resolves.toEqual([])
		await expect(api.createBudget(testBudget)).resolves.toEqual(testBudget)
		await expect(api.listBudgets()).resolves.toEqual([testBudget])
	})

	it('updates a budget', async () => {
		const api = createMockHarnessApi()
		await api.createBudget(testBudget)

		const updated: Budget = { ...testBudget, name: 'Updated' }
		await expect(api.updateBudget('b1', updated)).resolves.toEqual(updated)
	})

	it('throws when updating a non-existent budget', async () => {
		const api = createMockHarnessApi()

		await expect(api.updateBudget('nope', testBudget)).rejects.toThrow(
			'Budget not found: nope',
		)
	})

	it('creates and lists permissions', async () => {
		const api = createMockHarnessApi()

		await expect(api.listPermissions()).resolves.toEqual([])
		await expect(api.createPermission(testPermission)).resolves.toEqual(
			testPermission,
		)
		await expect(api.listPermissions()).resolves.toEqual([testPermission])
	})

	it('updates a permission', async () => {
		const api = createMockHarnessApi()
		await api.createPermission(testPermission)

		const updated: Permission = { ...testPermission, name: 'Updated' }
		await expect(api.updatePermission('p1', updated)).resolves.toEqual(updated)
	})

	it('throws when updating a non-existent permission', async () => {
		const api = createMockHarnessApi()

		await expect(api.updatePermission('nope', testPermission)).rejects.toThrow(
			'Permission not found: nope',
		)
	})

	it('approves a tool call', async () => {
		const api = createMockHarnessApi()

		await expect(api.approveToolCall('tc-1')).resolves.toBeUndefined()
	})

	it('denies a tool call', async () => {
		const api = createMockHarnessApi()

		await expect(api.denyToolCall('tc-1')).resolves.toBeUndefined()
	})

	it('subscribes to events and returns an unsubscribe function', () => {
		const api = createMockHarnessApi()

		const unsubscribe = api.subscribeToEvents('s1', () => {})
		expect(typeof unsubscribe).toBe('function')
		unsubscribe()
	})
})
