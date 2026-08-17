import { describe, expect, it, vi } from 'vitest'
import type { DenyToolCallUseCasePort } from '@/application/ports/usecases/DenyToolCallUseCasePort'
import DenyToolCallEndpoint from './DenyToolCallEndpoint'

describe('DenyToolCallEndpoint', () => {
	it('exposes the POST /api/tool-calls/:toolCallId/deny contract', () => {
		const usecase = { handle: vi.fn() } as DenyToolCallUseCasePort
		const endpoint = new DenyToolCallEndpoint(usecase)

		expect(endpoint.toInfo()).toMatchObject({
			method: 'POST',
			path: '/api/tool-calls/:toolCallId/deny',
		})
	})

	it('validates input and calls the usecase', async () => {
		const usecase = {
			handle: vi.fn().mockResolvedValue({ toolCallId: 'call-1', denied: true }),
		} as DenyToolCallUseCasePort
		const endpoint = new DenyToolCallEndpoint(usecase)
		const handler = endpoint.createHandler()

		const output = await handler(
			{ toolCallId: 'call-1' },
			{},
			{ toolCallId: 'call-1' },
			{},
		)

		expect(usecase.handle).toHaveBeenCalledWith({ toolCallId: 'call-1' })
		expect(output).toEqual({ toolCallId: 'call-1', denied: true })
	})
})
