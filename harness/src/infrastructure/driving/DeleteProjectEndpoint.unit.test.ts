import { describe, expect, it, vi } from 'vitest'
import type { DeleteProjectUseCasePort } from '@/application/ports/usecases/DeleteProjectUseCasePort'
import DeleteProjectEndpoint from './DeleteProjectEndpoint'

describe('DeleteProjectEndpoint', () => {
	it('exposes the correct contract', () => {
		const usecase = {
			handle: vi.fn().mockResolvedValue({ ok: true }),
		} as unknown as DeleteProjectUseCasePort

		const endpoint = new DeleteProjectEndpoint(usecase)
		const info = endpoint.toInfo()

		expect(info.method).toBe('DELETE')
		expect(info.path).toBe('/api/projects/:projectId')
	})

	it('delegates to the usecase and returns the response', async () => {
		const usecase = {
			handle: vi.fn().mockResolvedValue({ ok: true }),
		} as unknown as DeleteProjectUseCasePort

		const endpoint = new DeleteProjectEndpoint(usecase)
		const handler = endpoint.createHandler()
		const result = await handler({ projectId: 'p1' }, {}, undefined, {})

		expect(usecase.handle).toHaveBeenCalledWith({ projectId: 'p1' })
		expect(result).toEqual({ ok: true })
	})
})
