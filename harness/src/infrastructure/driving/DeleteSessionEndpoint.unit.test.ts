import { describe, expect, it, vi } from 'vitest'
import type { DeleteSessionUseCasePort } from '@/application/ports/usecases/DeleteSessionUseCasePort'
import DeleteSessionEndpoint from './DeleteSessionEndpoint'

describe('DeleteSessionEndpoint', () => {
	it('exposes the correct contract', () => {
		const usecase = {
			handle: vi.fn().mockResolvedValue({ ok: true }),
		} as unknown as DeleteSessionUseCasePort

		const endpoint = new DeleteSessionEndpoint(usecase)
		const info = endpoint.toInfo()

		expect(info.method).toBe('DELETE')
		expect(info.path).toBe('/api/projects/:projectId/sessions/:sessionId')
	})

	it('delegates to the usecase and returns the response', async () => {
		const usecase = {
			handle: vi.fn().mockResolvedValue({ ok: true }),
		} as unknown as DeleteSessionUseCasePort

		const endpoint = new DeleteSessionEndpoint(usecase)
		const handler = endpoint.createHandler()
		const result = await handler(
			{ projectId: 'p1', sessionId: 's1' },
			{},
			undefined,
			{},
		)

		expect(usecase.handle).toHaveBeenCalledWith({
			projectId: 'p1',
			sessionId: 's1',
		})
		expect(result).toEqual({ ok: true })
	})
})
