import { describe, expect, it, vi } from 'vitest'
import type { ConfigRepositoryPort } from '@/application/ports/adapters/ConfigRepositoryPort'
import type { HarnessConfig } from '@/domain/Config'
import GetConfigUsecase from './GetConfigUsecase'

const validConfig: HarnessConfig = {
	schemaVersion: 1,
	port: 3000,
	projectsDir: '/tmp/openharness/projects',
	openaiModel: 'gpt-4o-mini',
	openaiBaseUrl: null,
}

describe('GetConfigUsecase', () => {
	it('returns the stored config', async () => {
		const configs = {
			load: vi.fn().mockResolvedValue(validConfig),
		} as ConfigRepositoryPort
		const usecase = new GetConfigUsecase(configs)

		await expect(usecase.handle()).resolves.toEqual({ config: validConfig })
		expect(configs.load).toHaveBeenCalledOnce()
	})

	it('throws when the config is missing', async () => {
		const configs = {
			load: vi.fn().mockResolvedValue(null),
		} as ConfigRepositoryPort
		const usecase = new GetConfigUsecase(configs)

		await expect(usecase.handle()).rejects.toThrow(
			'Harness config is not initialized',
		)
	})
})
