import { mockState } from '../mock'
import type { SessionEvent } from '../schema'
import type {
	Agent,
	Budget,
	HarnessApi,
	HarnessConfig,
	Permission,
	Rule,
	SessionSummary,
	UpdateConfigInput,
} from './HarnessApi'

export function createMockHarnessApi(): HarnessApi {
	let config: HarnessConfig = {
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
	}
	let sessionId: string | null = null

	const agents: Agent[] = []
	const rules: Rule[] = []
	const budgets: Budget[] = []
	const permissions: Permission[] = []

	return {
		async health() {
			return undefined
		},
		async listProjects() {
			return mockState.projects
		},
		async createProject(name) {
			const project = {
				id: crypto.randomUUID(),
				name,
				status: 'idle' as const,
			}
			mockState.projects.push(project)
			return project
		},
		async listSessions(projectId): Promise<SessionSummary[]> {
			if (!sessionId) return []
			return [
				{
					id: sessionId,
					projectId,
					status: 'active',
					createdAt: new Date().toISOString(),
					endedAt: null,
					eventCount: 5,
					lastEventAt: new Date().toISOString(),
				},
			]
		},
		async sendMessage(projectId, content) {
			const trimmed = content.trim()
			if (!trimmed) {
				throw new Error('content must not be empty')
			}

			if (!sessionId) {
				sessionId = crypto.randomUUID()
			}

			const now = new Date().toISOString()
			const toolCallId = crypto.randomUUID()
			const events: SessionEvent[] = [
				{
					id: crypto.randomUUID(),
					sessionId: sessionId,
					projectId,
					turnId: null,
					stepId: null,
					timestamp: now,
					actor: 'user',
					type: 'user_message',
					payload: { content: trimmed },
					visibility: 'both',
				},
				{
					id: crypto.randomUUID(),
					sessionId: sessionId,
					projectId,
					turnId: null,
					stepId: null,
					timestamp: now,
					actor: 'agent',
					type: 'model_output_received',
					payload: {
						thinking: `Thinking about: ${trimmed}`,
						toolCalls: [],
						response: '',
					},
					visibility: 'both',
				},
				{
					id: crypto.randomUUID(),
					sessionId: sessionId,
					projectId,
					turnId: null,
					stepId: null,
					timestamp: now,
					actor: 'agent',
					type: 'tool_call_requested',
					payload: {
						toolCallId,
						toolId: 'mock_tool',
						input: { value: trimmed },
					},
					visibility: 'both',
				},
				{
					id: crypto.randomUUID(),
					sessionId: sessionId,
					projectId,
					turnId: null,
					stepId: null,
					timestamp: now,
					actor: 'agent',
					type: 'tool_result_produced',
					payload: {
						toolCallId,
						toolId: 'mock_tool',
						status: 'completed',
						output: 'ok',
						error: null,
					},
					visibility: 'both',
				},
				{
					id: crypto.randomUUID(),
					sessionId: sessionId,
					projectId,
					turnId: null,
					stepId: null,
					timestamp: now,
					actor: 'agent',
					type: 'model_output_received',
					payload: {
						thinking: null,
						toolCalls: [],
						response: `Mock response to: ${trimmed}`,
					},
					visibility: 'both',
				},
			]

			return { sessionId: sessionId, events }
		},
		async getConfig() {
			return config
		},
		async updateConfig(input: UpdateConfigInput) {
			const restartRequired =
				input.port !== undefined && input.port !== config.port
			config = {
				...config,
				...input,
			}
			return { config, restartRequired }
		},
		async approveToolCall() {
			return undefined
		},
		async denyToolCall() {
			return undefined
		},
		subscribeToEvents() {
			return () => {}
		},
		async listAgents() {
			return agents
		},
		async createAgent(agent) {
			agents.push(agent)
			return agent
		},
		async updateAgent(id, agent) {
			const index = agents.findIndex((a) => a.id === id)
			if (index === -1) throw new Error(`Agent not found: ${id}`)
			agents[index] = agent
			return agent
		},
		async listRules() {
			return rules
		},
		async createRule(rule) {
			rules.push(rule)
			return rule
		},
		async updateRule(id, rule) {
			const index = rules.findIndex((r) => r.id === id)
			if (index === -1) throw new Error(`Rule not found: ${id}`)
			rules[index] = rule
			return rule
		},
		async listBudgets() {
			return budgets
		},
		async createBudget(budget) {
			budgets.push(budget)
			return budget
		},
		async updateBudget(id, budget) {
			const index = budgets.findIndex((b) => b.id === id)
			if (index === -1) throw new Error(`Budget not found: ${id}`)
			budgets[index] = budget
			return budget
		},
		async listPermissions() {
			return permissions
		},
		async createPermission(permission) {
			permissions.push(permission)
			return permission
		},
		async updatePermission(id, permission) {
			const index = permissions.findIndex((p) => p.id === id)
			if (index === -1) throw new Error(`Permission not found: ${id}`)
			permissions[index] = permission
			return permission
		},
	}
}
