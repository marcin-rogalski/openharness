import { describe, expect, it, vi } from 'vitest'
import type { StopSessionUseCasePort } from '@/application/ports/usecases/StopSessionUseCasePort'
import StopSessionEndpoint from './StopSessionEndpoint'

function createUsecaseMock() {
	return {
		handle: vi.fn().mockResolvedValue({ ok: true as const }),
	} as StopSessionUseCasePort
}

describe('StopSessionEndpoint', () => {
	it('exposes the correct method and path', () => {
		const endpoint = new StopSessionEndpoint(createUsecaseMock())
		const info = endpoint.toInfo()
		expect(info.method).toBe('POST')
		expect(info.path).toBe('/api/projects/:projectId/sessions/:sessionId/stop')
	})

	it('delegates to the usecase and returns the result', async () => {
		const usecase = createUsecaseMock()
		const endpoint = new StopSessionEndpoint(usecase)
		const handler = endpoint.createHandler()

		const result = await handler(
			{ projectId: 'project-1', sessionId: 'session-1' },
			{},
			undefined,
			{},
		)

		expect(usecase.handle).toHaveBeenCalledWith({
			projectId: 'project-1',
			sessionId: 'session-1',
		})
		expect(result).toEqual({ ok: true })
	})
})
