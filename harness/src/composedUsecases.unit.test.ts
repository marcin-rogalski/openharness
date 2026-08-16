import type { ConfigRepositoryPort } from '@/application/ports/adapters/ConfigRepositoryPort'
import GetConfigUsecase from '@/application/usecases/GetConfigUsecase'
import ListProjectsUsecase from '@/application/usecases/ListProjectsUsecase'
import SendProjectMessageUsecase from '@/application/usecases/SendProjectMessageUsecase'
import UpdateConfigUsecase from '@/application/usecases/UpdateConfigUsecase'
import type { HarnessConfig } from '@/domain/Config'
import { describe, expect, it, vi } from 'vitest'
import composeDriven from './composedDriven'
import composeUsecases from './composedUsecases'

const validConfig: HarnessConfig = {
	schemaVersion: 1,
	port: 3000,
	projectsDir: '/tmp/openharness/projects',
}

function createConfigRepository(config: HarnessConfig) {
	return {
		load: vi.fn().mockResolvedValue(config),
		save: vi.fn(),
	} as ConfigRepositoryPort
}

describe('composeUsecases', () => {
	it('builds the list projects usecase', async () => {
		const usecases = composeUsecases(
			await composeDriven(createConfigRepository(validConfig)),
		)

		expect(usecases.listProjects).toBeInstanceOf(ListProjectsUsecase)

		await expect(usecases.listProjects.handle()).resolves.toEqual({
			projects: [
				{ id: 'project-1', name: 'OpenHarness', status: 'running' },
				{ id: 'project-2', name: 'Tempo', status: 'idle' },
			],
		})
	})

	it('builds the send project message usecase', async () => {
		const usecases = composeUsecases(
			await composeDriven(createConfigRepository(validConfig)),
		)

		expect(usecases.sendProjectMessage).toBeInstanceOf(
			SendProjectMessageUsecase,
		)

		const result = await usecases.sendProjectMessage.handle({
			projectId: 'project-1',
			content: 'Hello',
		})

		expect(result.entries.map((entry) => entry.type)).toEqual([
			'user_message',
			'agent_thinking',
			'agent_tool_call',
			'agent_tool_call',
			'agent_response',
		])
	})

	it('builds the get config usecase', async () => {
		const usecases = composeUsecases(
			await composeDriven(createConfigRepository(validConfig)),
		)

		expect(usecases.getConfig).toBeInstanceOf(GetConfigUsecase)
		await expect(usecases.getConfig.handle()).resolves.toEqual({
			config: validConfig,
		})
	})

	it('builds the update config usecase', async () => {
		const configRepository = createConfigRepository(validConfig)
		const usecases = composeUsecases(await composeDriven(configRepository))

		expect(usecases.updateConfig).toBeInstanceOf(UpdateConfigUsecase)

		await expect(usecases.updateConfig.handle({ port: 4000 })).resolves.toEqual(
			{
				config: { ...validConfig, port: 4000 },
				restartRequired: true,
			},
		)
	})
})
