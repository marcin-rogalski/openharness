import { describe, expect, it, vi } from 'vitest'
import type { ListSessionsUseCasePort } from '@/application/ports/usecases/ListSessionsUseCasePort'
import ListSessionsEndpoint from './ListSessionsEndpoint'

describe('ListSessionsEndpoint', () => {
	it('exposes the GET /api/projects/:projectId/sessions contract', () => {
		const usecase = { handle: vi.fn() } as ListSessionsUseCasePort
		const endpoint = new ListSessionsEndpoint(usecase)

		expect(endpoint.toInfo()).toMatchObject({
			method: 'GET',
			path: '/api/projects/:projectId/sessions',
		})
	})

	it('calls the usecase with the parsed input and returns the session list', async () => {
		const sessions = [
			{
				id: 'session-1',
				projectId: 'project-1',
				status: 'active' as const,
				createdAt: '2025-01-01T00:00:00Z',
				endedAt: null,
				eventCount: 3,
				lastEventAt: '2025-01-01T00:03:00Z',
			},
		]
		const usecase = {
			handle: vi.fn().mockResolvedValue({ sessions }),
		} as ListSessionsUseCasePort
		const endpoint = new ListSessionsEndpoint(usecase)
		const handler = endpoint.createHandler()

		const output = await handler({ projectId: 'project-1' }, {}, {}, {})

		expect(usecase.handle).toHaveBeenCalledWith({ projectId: 'project-1' })
		expect(output).toEqual({ sessions })
	})
})
