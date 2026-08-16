import { describe, expect, it, vi } from 'vitest'
import type { UpdateConfigUseCasePort } from '@/application/ports/usecases/UpdateConfigUseCasePort'
import UpdateConfigEndpoint from './UpdateConfigEndpoint'

describe('UpdateConfigEndpoint', () => {
	it('exposes the PUT /api/config contract', () => {
		const usecase = { handle: vi.fn() } as UpdateConfigUseCasePort
		const endpoint = new UpdateConfigEndpoint(usecase)

		expect(endpoint.toInfo()).toMatchObject({
			method: 'PUT',
			path: '/api/config',
		})
	})

	it('validates input and calls the usecase', async () => {
		const output = {
			config: {
				schemaVersion: 1,
				port: 4000,
				projectsDir: '/tmp/openharness/projects',
			},
			restartRequired: true,
		}
		const usecase = {
			handle: vi.fn().mockResolvedValue(output),
		} as UpdateConfigUseCasePort
		const endpoint = new UpdateConfigEndpoint(usecase)
		const handler = endpoint.createHandler()

		await expect(handler({}, {}, { port: 4000 }, {})).resolves.toEqual(output)
		expect(usecase.handle).toHaveBeenCalledWith({ port: 4000 })
	})

	it('rejects an empty update body', async () => {
		const usecase = { handle: vi.fn() } as UpdateConfigUseCasePort
		const endpoint = new UpdateConfigEndpoint(usecase)
		const handler = endpoint.createHandler()

		await expect(handler({}, {}, {}, {})).rejects.toThrow()
		expect(usecase.handle).not.toHaveBeenCalled()
	})
})
