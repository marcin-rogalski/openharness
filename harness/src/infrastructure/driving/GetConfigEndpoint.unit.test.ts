import { describe, expect, it, vi } from 'vitest'
import type { GetConfigUseCasePort } from '@/application/ports/usecases/GetConfigUseCasePort'
import GetConfigEndpoint from './GetConfigEndpoint'

describe('GetConfigEndpoint', () => {
	it('exposes the GET /api/config contract', () => {
		const usecase = { handle: vi.fn() } as GetConfigUseCasePort
		const endpoint = new GetConfigEndpoint(usecase)

		expect(endpoint.toInfo()).toMatchObject({
			method: 'GET',
			path: '/api/config',
		})
	})

	it('calls the usecase and returns the config', async () => {
		const config = {
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
		const usecase = {
			handle: vi.fn().mockResolvedValue({ config }),
		} as GetConfigUseCasePort
		const endpoint = new GetConfigEndpoint(usecase)
		const handler = endpoint.createHandler()

		await expect(handler({}, {}, {}, {})).resolves.toEqual({ config })
		expect(usecase.handle).toHaveBeenCalledOnce()
	})
})
