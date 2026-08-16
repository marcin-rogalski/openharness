import { describe, expect, it, vi } from 'vitest'
import type { ListProjectsUseCasePort } from '@/application/ports/usecases/ListProjectsUseCasePort'
import ListProjectsEndpoint from './ListProjectsEndpoint'

describe('ListProjectsEndpoint', () => {
	it('exposes the GET /api/projects contract', () => {
		const usecase = { handle: vi.fn() } as ListProjectsUseCasePort
		const endpoint = new ListProjectsEndpoint(usecase)

		expect(endpoint.toInfo()).toMatchObject({
			method: 'GET',
			path: '/api/projects',
		})
	})

	it('calls the usecase and returns the project list', async () => {
		const projects = [
			{ id: 'project-1', name: 'OpenHarness', status: 'running' },
		]
		const usecase = {
			handle: vi.fn().mockResolvedValue({ projects }),
		} as ListProjectsUseCasePort
		const endpoint = new ListProjectsEndpoint(usecase)
		const handler = endpoint.createHandler()

		const output = await handler({}, {}, {}, {})

		expect(usecase.handle).toHaveBeenCalledOnce()
		expect(output).toEqual({ projects })
	})
})
