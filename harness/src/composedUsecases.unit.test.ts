import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ConfigRepositoryPort } from '@/application/ports/adapters/ConfigRepositoryPort'
import ApproveToolCallUsecase from '@/application/usecases/ApproveToolCallUsecase'
import DenyToolCallUsecase from '@/application/usecases/DenyToolCallUsecase'
import GetConfigUsecase from '@/application/usecases/GetConfigUsecase'
import ListProjectsUsecase from '@/application/usecases/ListProjectsUsecase'
import SendProjectMessageUsecase from '@/application/usecases/SendProjectMessageUsecase'
import UpdateConfigUsecase from '@/application/usecases/UpdateConfigUsecase'
import type { HarnessConfig } from '@/domain/Config'
import composeDriven from './composedDriven'
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

function createConfigRepository(config: HarnessConfig) {
	return {
		load: vi.fn().mockResolvedValue(config),
		save: vi.fn(),
	} as ConfigRepositoryPort
}

beforeEach(() => {
	vi.spyOn(globalThis, 'fetch').mockResolvedValue(
		new Response(
			JSON.stringify({
				choices: [
					{
						message: {
							role: 'assistant',
							content: 'Mock response',
							tool_calls: [],
						},
					},
				],
			}),
			{ status: 200, headers: { 'Content-Type': 'application/json' } },
		),
	)
})

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

		expect(result.sessionId).toBeTypeOf('string')
		expect(result.events.map((entry) => entry.type)).toEqual([
			'session_created',
			'user_message',
			'model_output_received',
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

	it('builds the approve tool call usecase', async () => {
		const usecases = composeUsecases(
			await composeDriven(createConfigRepository(validConfig)),
		)

		expect(usecases.approveToolCall).toBeInstanceOf(ApproveToolCallUsecase)
	})

	it('builds the deny tool call usecase', async () => {
		const usecases = composeUsecases(
			await composeDriven(createConfigRepository(validConfig)),
		)

		expect(usecases.denyToolCall).toBeInstanceOf(DenyToolCallUsecase)
	})
})
