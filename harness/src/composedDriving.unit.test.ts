import { describe, expect, it, vi } from 'vitest'
import type { ConfigRepositoryPort } from '@/application/ports/adapters/ConfigRepositoryPort'
import type { HarnessConfig } from '@/domain/Config'
import ApproveToolCallEndpoint from '@/infrastructure/driving/ApproveToolCallEndpoint'
import DenyToolCallEndpoint from '@/infrastructure/driving/DenyToolCallEndpoint'
import GetConfigEndpoint from '@/infrastructure/driving/GetConfigEndpoint'
import HealthEndpoint from '@/infrastructure/driving/HealthEndpoint'
import ListProjectsEndpoint from '@/infrastructure/driving/ListProjectsEndpoint'
import SendProjectMessageEndpoint from '@/infrastructure/driving/SendProjectMessageEndpoint'
import UpdateConfigEndpoint from '@/infrastructure/driving/UpdateConfigEndpoint'
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

	it('builds the send project message endpoint', async () => {
		const configRepository = {
			load: vi.fn(),
			save: vi.fn(),
		} as ConfigRepositoryPort
		const endpoints = composeDriving(
			composeUsecases(await composeDriven(configRepository)),
		)

		expect(endpoints[2]).toBeInstanceOf(SendProjectMessageEndpoint)
		expect(endpoints[2].toInfo()).toMatchObject({
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

		expect(endpoints).toHaveLength(7)
		expect(endpoints[3]).toBeInstanceOf(GetConfigEndpoint)
		expect(endpoints[3].toInfo()).toMatchObject({
			method: 'GET',
			path: '/api/config',
		})
		expect(endpoints[4]).toBeInstanceOf(UpdateConfigEndpoint)
		expect(endpoints[4].toInfo()).toMatchObject({
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

		expect(endpoints[5]).toBeInstanceOf(ApproveToolCallEndpoint)
		expect(endpoints[5].toInfo()).toMatchObject({
			method: 'POST',
			path: '/api/tool-calls/:toolCallId/approve',
		})
		expect(endpoints[6]).toBeInstanceOf(DenyToolCallEndpoint)
		expect(endpoints[6].toInfo()).toMatchObject({
			method: 'POST',
			path: '/api/tool-calls/:toolCallId/deny',
		})
	})
})
