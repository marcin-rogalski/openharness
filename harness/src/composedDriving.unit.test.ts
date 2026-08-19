import { describe, expect, it, vi } from 'vitest'
import type { ConfigRepositoryPort } from '@/application/ports/adapters/ConfigRepositoryPort'
import type { HarnessConfig } from '@/domain/Config'
import ApproveToolCallEndpoint from '@/infrastructure/driving/ApproveToolCallEndpoint'
import CreateAgentEndpoint from '@/infrastructure/driving/CreateAgentEndpoint'
import CreateBudgetEndpoint from '@/infrastructure/driving/CreateBudgetEndpoint'
import CreatePermissionEndpoint from '@/infrastructure/driving/CreatePermissionEndpoint'
import CreateRuleEndpoint from '@/infrastructure/driving/CreateRuleEndpoint'
import DenyToolCallEndpoint from '@/infrastructure/driving/DenyToolCallEndpoint'
import GetConfigEndpoint from '@/infrastructure/driving/GetConfigEndpoint'
import HealthEndpoint from '@/infrastructure/driving/HealthEndpoint'
import ListAgentsEndpoint from '@/infrastructure/driving/ListAgentsEndpoint'
import ListBudgetsEndpoint from '@/infrastructure/driving/ListBudgetsEndpoint'
import ListPermissionsEndpoint from '@/infrastructure/driving/ListPermissionsEndpoint'
import ListProjectsEndpoint from '@/infrastructure/driving/ListProjectsEndpoint'
import ListRulesEndpoint from '@/infrastructure/driving/ListRulesEndpoint'
import ListSessionsEndpoint from '@/infrastructure/driving/ListSessionsEndpoint'
import SendProjectMessageEndpoint from '@/infrastructure/driving/SendProjectMessageEndpoint'
import UpdateAgentEndpoint from '@/infrastructure/driving/UpdateAgentEndpoint'
import UpdateBudgetEndpoint from '@/infrastructure/driving/UpdateBudgetEndpoint'
import UpdateConfigEndpoint from '@/infrastructure/driving/UpdateConfigEndpoint'
import UpdatePermissionEndpoint from '@/infrastructure/driving/UpdatePermissionEndpoint'
import UpdateRuleEndpoint from '@/infrastructure/driving/UpdateRuleEndpoint'
import composeDriven from './composedDriven'
import composeDriving from './composedDriving'
import composeUsecases from './composedUsecases'

const validConfig: HarnessConfig = {
	schemaVersion: 1,
	port: 3000,
	projectsDir: '/tmp/openharness/projects',
	providers: {
		openai: {
			url: 'https://api.openai.com/v1',
			models: { 'gpt-4o-mini': { label: 'GPT-4o Mini' } },
		},
	},
	defaultModel: 'openai/gpt-4o-mini',
}

describe('composeDriving', () => {
	it('builds the health endpoint', async () => {
		const configRepository = {
			load: vi.fn(),
			save: vi.fn(),
		} as ConfigRepositoryPort
		const endpoints = composeDriving(
			composeUsecases(await composeDriven(configRepository)),
		)

		expect(endpoints[0]).toBeInstanceOf(HealthEndpoint)
		expect(endpoints[0].toInfo()).toMatchObject({
			method: 'GET',
			path: '/api/health',
		})
	})

	it('builds the list projects endpoint', async () => {
		const configRepository = {
			load: vi.fn(),
			save: vi.fn(),
		} as ConfigRepositoryPort
		const endpoints = composeDriving(
			composeUsecases(await composeDriven(configRepository)),
		)

		expect(endpoints[1]).toBeInstanceOf(ListProjectsEndpoint)
		expect(endpoints[1].toInfo()).toMatchObject({
			method: 'GET',
			path: '/api/projects',
		})
	})

	it('builds the list sessions endpoint', async () => {
		const configRepository = {
			load: vi.fn(),
			save: vi.fn(),
		} as ConfigRepositoryPort
		const endpoints = composeDriving(
			composeUsecases(await composeDriven(configRepository)),
		)

		expect(endpoints[2]).toBeInstanceOf(ListSessionsEndpoint)
		expect(endpoints[2].toInfo()).toMatchObject({
			method: 'GET',
			path: '/api/projects/:projectId/sessions',
		})
	})

	it('builds the send project message endpoint', async () => {
		const configRepository = {
			load: vi.fn(),
			save: vi.fn(),
		} as ConfigRepositoryPort
		const endpoints = composeDriving(
			composeUsecases(await composeDriven(configRepository)),
		)

		expect(endpoints[3]).toBeInstanceOf(SendProjectMessageEndpoint)
		expect(endpoints[3].toInfo()).toMatchObject({
			method: 'POST',
			path: '/api/projects/:projectId/messages',
		})
	})

	it('builds the config endpoints', async () => {
		const configRepository = {
			load: vi.fn().mockResolvedValue(validConfig),
			save: vi.fn(),
		} as ConfigRepositoryPort
		const endpoints = composeDriving(
			composeUsecases(await composeDriven(configRepository)),
		)

		expect(endpoints).toHaveLength(20)
		expect(endpoints[4]).toBeInstanceOf(GetConfigEndpoint)
		expect(endpoints[4].toInfo()).toMatchObject({
			method: 'GET',
			path: '/api/config',
		})
		expect(endpoints[5]).toBeInstanceOf(UpdateConfigEndpoint)
		expect(endpoints[5].toInfo()).toMatchObject({
			method: 'PUT',
			path: '/api/config',
		})
	})

	it('builds the tool call endpoints', async () => {
		const configRepository = {
			load: vi.fn().mockResolvedValue(validConfig),
			save: vi.fn(),
		} as ConfigRepositoryPort
		const endpoints = composeDriving(
			composeUsecases(await composeDriven(configRepository)),
		)

		expect(endpoints[6]).toBeInstanceOf(ApproveToolCallEndpoint)
		expect(endpoints[6].toInfo()).toMatchObject({
			method: 'POST',
			path: '/api/tool-calls/:toolCallId/approve',
		})
		expect(endpoints[7]).toBeInstanceOf(DenyToolCallEndpoint)
		expect(endpoints[7].toInfo()).toMatchObject({
			method: 'POST',
			path: '/api/tool-calls/:toolCallId/deny',
		})
	})

	it('builds the agent endpoints', async () => {
		const configRepository = {
			load: vi.fn().mockResolvedValue(validConfig),
			save: vi.fn(),
		} as ConfigRepositoryPort
		const endpoints = composeDriving(
			composeUsecases(await composeDriven(configRepository)),
		)

		expect(endpoints[8]).toBeInstanceOf(ListAgentsEndpoint)
		expect(endpoints[8].toInfo()).toMatchObject({
			method: 'GET',
			path: '/api/agents',
		})
		expect(endpoints[9]).toBeInstanceOf(CreateAgentEndpoint)
		expect(endpoints[9].toInfo()).toMatchObject({
			method: 'POST',
			path: '/api/agents',
		})
		expect(endpoints[10]).toBeInstanceOf(UpdateAgentEndpoint)
		expect(endpoints[10].toInfo()).toMatchObject({
			method: 'PUT',
			path: '/api/agents',
		})
	})

	it('builds the rule endpoints', async () => {
		const configRepository = {
			load: vi.fn().mockResolvedValue(validConfig),
			save: vi.fn(),
		} as ConfigRepositoryPort
		const endpoints = composeDriving(
			composeUsecases(await composeDriven(configRepository)),
		)

		expect(endpoints[11]).toBeInstanceOf(ListRulesEndpoint)
		expect(endpoints[11].toInfo()).toMatchObject({
			method: 'GET',
			path: '/api/rules',
		})
		expect(endpoints[12]).toBeInstanceOf(CreateRuleEndpoint)
		expect(endpoints[12].toInfo()).toMatchObject({
			method: 'POST',
			path: '/api/rules',
		})
		expect(endpoints[13]).toBeInstanceOf(UpdateRuleEndpoint)
		expect(endpoints[13].toInfo()).toMatchObject({
			method: 'PUT',
			path: '/api/rules',
		})
	})

	it('builds the budget endpoints', async () => {
		const configRepository = {
			load: vi.fn().mockResolvedValue(validConfig),
			save: vi.fn(),
		} as ConfigRepositoryPort
		const endpoints = composeDriving(
			composeUsecases(await composeDriven(configRepository)),
		)

		expect(endpoints[14]).toBeInstanceOf(ListBudgetsEndpoint)
		expect(endpoints[14].toInfo()).toMatchObject({
			method: 'GET',
			path: '/api/budgets',
		})
		expect(endpoints[15]).toBeInstanceOf(CreateBudgetEndpoint)
		expect(endpoints[15].toInfo()).toMatchObject({
			method: 'POST',
			path: '/api/budgets',
		})
		expect(endpoints[16]).toBeInstanceOf(UpdateBudgetEndpoint)
		expect(endpoints[16].toInfo()).toMatchObject({
			method: 'PUT',
			path: '/api/budgets',
		})
	})

	it('builds the permission endpoints', async () => {
		const configRepository = {
			load: vi.fn().mockResolvedValue(validConfig),
			save: vi.fn(),
		} as ConfigRepositoryPort
		const endpoints = composeDriving(
			composeUsecases(await composeDriven(configRepository)),
		)

		expect(endpoints[17]).toBeInstanceOf(ListPermissionsEndpoint)
		expect(endpoints[17].toInfo()).toMatchObject({
			method: 'GET',
			path: '/api/permissions',
		})
		expect(endpoints[18]).toBeInstanceOf(CreatePermissionEndpoint)
		expect(endpoints[18].toInfo()).toMatchObject({
			method: 'POST',
			path: '/api/permissions',
		})
		expect(endpoints[19]).toBeInstanceOf(UpdatePermissionEndpoint)
		expect(endpoints[19].toInfo()).toMatchObject({
			method: 'PUT',
			path: '/api/permissions',
		})
	})
})
