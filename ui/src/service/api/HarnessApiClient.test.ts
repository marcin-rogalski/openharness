import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Agent, Budget, Permission, Rule } from './HarnessApi'
import { createHarnessApiClient } from './HarnessApiClient'

function jsonResponse(status: number, body: unknown) {
	return {
		ok: status >= 200 && status < 300,
		status,
		json: async () => body,
	} as unknown as Response
}

describe('createHarnessApiClient', () => {
	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('checks harness health', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(jsonResponse(200, { status: 'ok' }))
		vi.stubGlobal('fetch', fetchMock)
		const api = createHarnessApiClient()

		await expect(api.health()).resolves.toBeUndefined()

		expect(fetchMock).toHaveBeenCalledWith(
			'/api/health',
			expect.objectContaining({
				headers: { 'Content-Type': 'application/json' },
			}),
		)
	})

	it('lists projects from the harness API', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			jsonResponse(200, {
				projects: [{ id: 'project-1', name: 'OpenHarness', status: 'running' }],
			}),
		)
		vi.stubGlobal('fetch', fetchMock)
		const api = createHarnessApiClient()

		await expect(api.listProjects()).resolves.toEqual([
			{ id: 'project-1', name: 'OpenHarness', status: 'running' },
		])

		expect(fetchMock).toHaveBeenCalledWith(
			'/api/projects',
			expect.objectContaining({
				headers: { 'Content-Type': 'application/json' },
			}),
		)
	})

	it('sends a message to the selected project', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			jsonResponse(200, {
				sessionId: 'session-1',
				events: [
					{
						id: 'event-1',
						sessionId: 'session-1',
						projectId: 'project 1',
						turnId: null,
						stepId: null,
						timestamp: '2025-01-01T00:00:00.000Z',
						actor: 'user',
						type: 'user_message',
						payload: { content: 'Hello' },
						visibility: 'both',
					},
				],
			}),
		)
		vi.stubGlobal('fetch', fetchMock)
		const api = createHarnessApiClient()

		const result = await api.sendMessage('project 1', 'Hello')

		expect(result.sessionId).toBe('session-1')
		expect(result.events).toHaveLength(1)
		expect(result.events[0]).toMatchObject({
			type: 'user_message',
			payload: { content: 'Hello' },
		})

		expect(fetchMock).toHaveBeenCalledWith(
			'/api/projects/project%201/messages',
			expect.objectContaining({
				method: 'POST',
				body: JSON.stringify({ content: 'Hello' }),
			}),
		)
	})

	it('reads the harness config', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			jsonResponse(200, {
				config: {
					schemaVersion: 1,
					port: 3000,
					projectsDir: '/tmp/projects',
					providers: {
						openai: {
							url: 'https://api.openai.com/v1',
							models: { 'gpt-4o-mini': { label: 'GPT-4o Mini' } },
						},
					},
					defaultModel: 'openai/gpt-4o-mini',
				},
			}),
		)
		vi.stubGlobal('fetch', fetchMock)
		const api = createHarnessApiClient()

		await expect(api.getConfig()).resolves.toEqual({
			schemaVersion: 1,
			port: 3000,
			projectsDir: '/tmp/projects',
			providers: {
				openai: {
					url: 'https://api.openai.com/v1',
					models: { 'gpt-4o-mini': { label: 'GPT-4o Mini' } },
				},
			},
			defaultModel: 'openai/gpt-4o-mini',
		})

		expect(fetchMock).toHaveBeenCalledWith(
			'/api/config',
			expect.objectContaining({
				headers: { 'Content-Type': 'application/json' },
			}),
		)
	})

	it('updates the harness config', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			jsonResponse(200, {
				config: {
					schemaVersion: 1,
					port: 4000,
					projectsDir: '/tmp/projects',
					providers: {
						openai: {
							url: 'https://api.openai.com/v1',
							models: { 'gpt-4o-mini': { label: 'GPT-4o Mini' } },
						},
					},
					defaultModel: 'openai/gpt-4o-mini',
				},
				restartRequired: true,
			}),
		)
		vi.stubGlobal('fetch', fetchMock)
		const api = createHarnessApiClient()

		await expect(api.updateConfig({ port: 4000 })).resolves.toEqual({
			config: {
				schemaVersion: 1,
				port: 4000,
				projectsDir: '/tmp/projects',
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

		expect(fetchMock).toHaveBeenCalledWith(
			'/api/config',
			expect.objectContaining({
				method: 'PUT',
				body: JSON.stringify({ port: 4000 }),
			}),
		)
	})

	it('throws the harness error message when the request fails', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(jsonResponse(500, { error: 'boom' }))
		vi.stubGlobal('fetch', fetchMock)
		const api = createHarnessApiClient()

		await expect(api.listProjects()).rejects.toThrow('boom')
	})

	it('falls back to a status message when the error payload has no message', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(jsonResponse(503, { message: 'nope' }))
		vi.stubGlobal('fetch', fetchMock)
		const api = createHarnessApiClient()

		await expect(api.listProjects()).rejects.toThrow(
			'Request failed with status 503',
		)
	})

	it('lists agents', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			jsonResponse(200, {
				agents: [
					{
						id: 'a1',
						name: 'Test',
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
					},
				],
			}),
		)
		vi.stubGlobal('fetch', fetchMock)
		const api = createHarnessApiClient()

		const agents = await api.listAgents()
		expect(agents).toHaveLength(1)
		expect(agents[0].name).toBe('Test')
	})

	it('creates an agent', async () => {
		const agent: Agent = {
			id: 'a1',
			name: 'New',
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
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { agent }))
		vi.stubGlobal('fetch', fetchMock)
		const api = createHarnessApiClient()

		const result = await api.createAgent(agent)
		expect(result.id).toBe('a1')
		expect(fetchMock).toHaveBeenCalledWith(
			'/api/agents',
			expect.objectContaining({ method: 'POST' }),
		)
	})

	it('updates an agent', async () => {
		const agent: Agent = {
			id: 'a1',
			name: 'Updated',
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
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { agent }))
		vi.stubGlobal('fetch', fetchMock)
		const api = createHarnessApiClient()

		const result = await api.updateAgent('a1', agent)
		expect(result.name).toBe('Updated')
	})

	it('lists rules', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			jsonResponse(200, {
				rules: [
					{
						id: 'r1',
						name: 'Test Rule',
						when: 'tool_call',
						condition: {},
						action: 'deny',
						guard: null,
					},
				],
			}),
		)
		vi.stubGlobal('fetch', fetchMock)
		const api = createHarnessApiClient()

		const rules = await api.listRules()
		expect(rules).toHaveLength(1)
		expect(rules[0].name).toBe('Test Rule')
	})

	it('creates a rule', async () => {
		const rule: Rule = {
			id: 'r1',
			name: 'New Rule',
			when: 'tool_call',
			condition: {},
			action: 'deny',
			guard: null,
		}
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { rule }))
		vi.stubGlobal('fetch', fetchMock)
		const api = createHarnessApiClient()

		const result = await api.createRule(rule)
		expect(result.id).toBe('r1')
	})

	it('updates a rule', async () => {
		const rule: Rule = {
			id: 'r1',
			name: 'Updated',
			when: 'tool_call',
			condition: {},
			action: 'allow',
			guard: null,
		}
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { rule }))
		vi.stubGlobal('fetch', fetchMock)
		const api = createHarnessApiClient()

		const result = await api.updateRule('r1', rule)
		expect(result.name).toBe('Updated')
	})

	it('lists budgets', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			jsonResponse(200, {
				budgets: [
					{
						id: 'b1',
						name: 'Default',
						tokenLimitPerTurn: 1000,
						tokenLimitPerSession: null,
						costLimitPerTurn: null,
						costLimitPerSession: null,
						enforcementPoint: 'pre_request',
					},
				],
			}),
		)
		vi.stubGlobal('fetch', fetchMock)
		const api = createHarnessApiClient()

		const budgets = await api.listBudgets()
		expect(budgets).toHaveLength(1)
		expect(budgets[0].tokenLimitPerTurn).toBe(1000)
	})

	it('creates a budget', async () => {
		const budget: Budget = {
			id: 'b1',
			name: 'New',
			tokenLimitPerTurn: 500,
			tokenLimitPerSession: null,
			costLimitPerTurn: null,
			costLimitPerSession: null,
			enforcementPoint: 'pre_request',
		}
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { budget }))
		vi.stubGlobal('fetch', fetchMock)
		const api = createHarnessApiClient()

		const result = await api.createBudget(budget)
		expect(result.id).toBe('b1')
	})

	it('updates a budget', async () => {
		const budget: Budget = {
			id: 'b1',
			name: 'Updated',
			tokenLimitPerTurn: 2000,
			tokenLimitPerSession: null,
			costLimitPerTurn: null,
			costLimitPerSession: null,
			enforcementPoint: 'pre_request',
		}
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { budget }))
		vi.stubGlobal('fetch', fetchMock)
		const api = createHarnessApiClient()

		const result = await api.updateBudget('b1', budget)
		expect(result.name).toBe('Updated')
	})

	it('lists permissions', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			jsonResponse(200, {
				permissions: [
					{
						id: 'p1',
						name: 'Test',
						resource: 'tool',
						resourceId: 'bash',
						action: 'allow',
						scope: 'project',
						scopeId: null,
					},
				],
			}),
		)
		vi.stubGlobal('fetch', fetchMock)
		const api = createHarnessApiClient()

		const permissions = await api.listPermissions()
		expect(permissions).toHaveLength(1)
		expect(permissions[0].resource).toBe('tool')
	})

	it('creates a permission', async () => {
		const permission: Permission = {
			id: 'p1',
			name: 'New',
			resource: 'tool',
			resourceId: 'bash',
			action: 'allow',
			scope: 'project',
			scopeId: null,
		}
		const fetchMock = vi
			.fn()
			.mockResolvedValue(jsonResponse(200, { permission }))
		vi.stubGlobal('fetch', fetchMock)
		const api = createHarnessApiClient()

		const result = await api.createPermission(permission)
		expect(result.id).toBe('p1')
	})

	it('updates a permission', async () => {
		const permission: Permission = {
			id: 'p1',
			name: 'Updated',
			resource: 'tool',
			resourceId: 'bash',
			action: 'deny',
			scope: 'project',
			scopeId: null,
		}
		const fetchMock = vi
			.fn()
			.mockResolvedValue(jsonResponse(200, { permission }))
		vi.stubGlobal('fetch', fetchMock)
		const api = createHarnessApiClient()

		const result = await api.updatePermission('p1', permission)
		expect(result.name).toBe('Updated')
	})

	it('approves a tool call', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(
				jsonResponse(200, { toolCallId: 'tc-1', approved: true }),
			)
		vi.stubGlobal('fetch', fetchMock)
		const api = createHarnessApiClient()

		await expect(api.approveToolCall('tc-1')).resolves.toBeUndefined()

		expect(fetchMock).toHaveBeenCalledWith(
			'/api/tool-calls/tc-1/approve',
			expect.objectContaining({
				method: 'POST',
				body: JSON.stringify({ toolCallId: 'tc-1' }),
			}),
		)
	})

	it('denies a tool call', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(
				jsonResponse(200, { toolCallId: 'tc-1', denied: true }),
			)
		vi.stubGlobal('fetch', fetchMock)
		const api = createHarnessApiClient()

		await expect(api.denyToolCall('tc-1')).resolves.toBeUndefined()

		expect(fetchMock).toHaveBeenCalledWith(
			'/api/tool-calls/tc-1/deny',
			expect.objectContaining({
				method: 'POST',
				body: JSON.stringify({ toolCallId: 'tc-1' }),
			}),
		)
	})

	it('subscribes to events and receives them', () => {
		const events: unknown[] = []
		const closeMock = vi.fn()
		class MockEventSource {
			close = closeMock
			set onmessage(handler: (msg: MessageEvent) => void) {
				handler({
					data: JSON.stringify({
						id: 'e1',
						sessionId: 's1',
						projectId: 'p1',
						turnId: null,
						stepId: null,
						timestamp: '2025-01-01T00:00:00.000Z',
						actor: 'system',
						type: 'approval_requested',
						payload: { toolCallId: 'tc-1', tool: 'bash', input: 'ls' },
						visibility: 'user',
					}),
				} as MessageEvent)
			}
		}
		vi.stubGlobal('EventSource', MockEventSource)

		const api = createHarnessApiClient()
		const unsubscribe = api.subscribeToEvents('s1', (event) => {
			events.push(event)
		})

		expect(events).toHaveLength(1)
		expect(events[0]).toMatchObject({ type: 'approval_requested' })

		unsubscribe()
		expect(closeMock).toHaveBeenCalled()
	})

	it('ignores malformed event data', () => {
		const events: unknown[] = []
		class MockEventSource {
			close = vi.fn()
			set onmessage(handler: (msg: MessageEvent) => void) {
				handler({ data: 'not-json' } as MessageEvent)
			}
		}
		vi.stubGlobal('EventSource', MockEventSource)

		const api = createHarnessApiClient()
		const unsubscribe = api.subscribeToEvents('s1', (event) => {
			events.push(event)
		})

		expect(events).toHaveLength(0)
		unsubscribe()
	})

	it('ignores events that fail schema validation', () => {
		const events: unknown[] = []
		class MockEventSource {
			close = vi.fn()
			set onmessage(handler: (msg: MessageEvent) => void) {
				handler({
					data: JSON.stringify({ id: 'e1' }),
				} as MessageEvent)
			}
		}
		vi.stubGlobal('EventSource', MockEventSource)

		const api = createHarnessApiClient()
		const unsubscribe = api.subscribeToEvents('s1', (event) => {
			events.push(event)
		})

		expect(events).toHaveLength(0)
		unsubscribe()
	})
})
