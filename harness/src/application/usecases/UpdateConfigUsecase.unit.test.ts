import { describe, expect, it, vi } from 'vitest'
import type { ConfigRepositoryPort } from '@/application/ports/adapters/ConfigRepositoryPort'
import type { HarnessConfig } from '@/domain/Config'
import UpdateConfigUsecase from './UpdateConfigUsecase'

const currentConfig: HarnessConfig = {
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

function createRepository(config: HarnessConfig | null) {
	const saved: HarnessConfig[] = []
	const repository = {
		load: vi.fn().mockResolvedValue(config),
		save: vi.fn(async (value: HarnessConfig) => {
			saved.push(value)
		}),
	}

	return { repository, saved }
}

describe('UpdateConfigUsecase', () => {
	it('updates the port and flags a restart', async () => {
		const { repository, saved } = createRepository(currentConfig)
		const usecase = new UpdateConfigUsecase(repository as ConfigRepositoryPort)

		const result = await usecase.handle({ port: 4000 })

		expect(result).toEqual({
			config: { ...currentConfig, port: 4000 },
			restartRequired: true,
		})
		expect(saved).toEqual([{ ...currentConfig, port: 4000 }])
	})

	it('updates the projects dir without flagging a restart', async () => {
		const { repository, saved } = createRepository(currentConfig)
		const usecase = new UpdateConfigUsecase(repository as ConfigRepositoryPort)

		const result = await usecase.handle({ projectsDir: '/custom/projects' })

		expect(result).toEqual({
			config: { ...currentConfig, projectsDir: '/custom/projects' },
			restartRequired: false,
		})
		expect(saved).toEqual([
			{ ...currentConfig, projectsDir: '/custom/projects' },
		])
	})

	it('rejects an empty update', async () => {
		const { repository } = createRepository(currentConfig)
		const usecase = new UpdateConfigUsecase(repository as ConfigRepositoryPort)

		await expect(usecase.handle({})).rejects.toThrow()
		expect(repository.save).not.toHaveBeenCalled()
	})

	it('throws when the config is missing', async () => {
		const { repository } = createRepository(null)
		const usecase = new UpdateConfigUsecase(repository as ConfigRepositoryPort)

		await expect(usecase.handle({ port: 4000 })).rejects.toThrow(
			'Harness config is not initialized',
		)
	})
})
