import { describe, expect, it, vi } from 'vitest'
import type { CreateSessionUseCasePort } from '@/application/ports/usecases/CreateSessionUseCasePort'
import CreateSessionEndpoint from './CreateSessionEndpoint'

describe('CreateSessionEndpoint', () => {
	it('exposes the correct contract', () => {
		const usecase = {
			handle: vi.fn().mockResolvedValue({
				session: {
					id: 's1',
					projectId: 'p1',
					status: 'active' as const,
					createdAt: new Date().toISOString(),
					endedAt: null,
				},
			}),
		} as unknown as CreateSessionUseCasePort

		const endpoint = new CreateSessionEndpoint(usecase)
		const info = endpoint.toInfo()

		expect(info.method).toBe('POST')
		expect(info.path).toBe('/api/projects/:projectId/sessions')
	})

	it('delegates to the usecase and returns the response', async () => {
		const session = {
			id: 's1',
			projectId: 'p1',
			status: 'active' as const,
			createdAt: new Date().toISOString(),
			endedAt: null,
		}
		const usecase = {
			handle: vi.fn().mockResolvedValue({ session }),
		} as unknown as CreateSessionUseCasePort

		const endpoint = new CreateSessionEndpoint(usecase)
		const handler = endpoint.createHandler()
		const result = await handler({ projectId: 'p1' }, {}, undefined, {})

		expect(usecase.handle).toHaveBeenCalledWith({ projectId: 'p1' })
		expect(result).toEqual({ session })
	})
})
