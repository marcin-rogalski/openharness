import { harnessApiSchema } from '@openharness/contracts'
import { FetchClient } from '@openharness/fetch'
import type { HarnessApi } from './HarnessApi'

export function createHarnessApiClient(baseUrl = ''): HarnessApi {
	const client = new FetchClient(harnessApiSchema, { baseUrl })

	return {
		async health() {
			await client.request('health')
		},
		async listProjects() {
			const payload = await client.request('listProjects')
			return payload.projects
		},
		async sendMessage(projectId, content) {
			const payload = await client.request('sendMessage', {
				params: { projectId },
				body: { content },
			})
			return { sessionId: payload.sessionId, events: payload.events }
		},
		async getConfig() {
			const payload = await client.request('getConfig')
			return payload.config
		},
		async updateConfig(input) {
			return client.request('updateConfig', { body: input })
		},
		async listAgents() {
			const payload = await client.request('listAgents')
			return payload.agents
		},
		async createAgent(agent) {
			const payload = await client.request('createAgent', {
				body: { agent },
			})
			return payload.agent
		},
		async updateAgent(id, agent) {
			const payload = await client.request('updateAgent', {
				body: { id, agent },
			})
			return payload.agent
		},
		async listRules() {
			const payload = await client.request('listRules')
			return payload.rules
		},
		async createRule(rule) {
			const payload = await client.request('createRule', {
				body: { rule },
			})
			return payload.rule
		},
		async updateRule(id, rule) {
			const payload = await client.request('updateRule', {
				body: { id, rule },
			})
			return payload.rule
		},
		async listBudgets() {
			const payload = await client.request('listBudgets')
			return payload.budgets
		},
		async createBudget(budget) {
			const payload = await client.request('createBudget', {
				body: { budget },
			})
			return payload.budget
		},
		async updateBudget(id, budget) {
			const payload = await client.request('updateBudget', {
				body: { id, budget },
			})
			return payload.budget
		},
		async listPermissions() {
			const payload = await client.request('listPermissions')
			return payload.permissions
		},
		async createPermission(permission) {
			const payload = await client.request('createPermission', {
				body: { permission },
			})
			return payload.permission
		},
		async updatePermission(id, permission) {
			const payload = await client.request('updatePermission', {
				body: { id, permission },
			})
			return payload.permission
		},
	}
}
