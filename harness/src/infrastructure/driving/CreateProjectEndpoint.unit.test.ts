import { describe, expect, it, vi } from 'vitest'
import type { CreateProjectUseCasePort } from '@/application/ports/usecases/CreateProjectUseCasePort'
import CreateProjectEndpoint from './CreateProjectEndpoint'

describe('CreateProjectEndpoint', () => {
	it('exposes the POST /api/projects contract', () => {
		const usecase = { handle: vi.fn() } as CreateProjectUseCasePort
		const endpoint = new CreateProjectEndpoint(usecase)

		expect(endpoint.toInfo()).toMatchObject({
			method: 'POST',
			path: '/api/projects',
		})
	})

	it('calls the usecase with the parsed body and returns the project', async () => {
		const project = { id: 'project-1', name: 'Test', status: 'idle' as const }
		const usecase = {
			handle: vi.fn().mockResolvedValue({ project }),
		} as CreateProjectUseCasePort
		const endpoint = new CreateProjectEndpoint(usecase)
		const handler = endpoint.createHandler()

		const output = await handler({}, {}, { name: 'Test' }, {})

		expect(usecase.handle).toHaveBeenCalledWith({ name: 'Test' })
		expect(output).toEqual({ project })
	})
})
