import { describe, expect, it, vi } from 'vitest'
import type { ApproveToolCallUseCasePort } from '@/application/ports/usecases/ApproveToolCallUseCasePort'
import ApproveToolCallEndpoint from './ApproveToolCallEndpoint'

describe('ApproveToolCallEndpoint', () => {
	it('exposes the POST /api/tool-calls/:toolCallId/approve contract', () => {
		const usecase = { handle: vi.fn() } as ApproveToolCallUseCasePort
		const endpoint = new ApproveToolCallEndpoint(usecase)

		expect(endpoint.toInfo()).toMatchObject({
			method: 'POST',
			path: '/api/tool-calls/:toolCallId/approve',
		})
	})

	it('validates input and calls the usecase', async () => {
		const usecase = {
			handle: vi
				.fn()
				.mockResolvedValue({ toolCallId: 'call-1', approved: true }),
		} as ApproveToolCallUseCasePort
		const endpoint = new ApproveToolCallEndpoint(usecase)
		const handler = endpoint.createHandler()

		const output = await handler(
			{ toolCallId: 'call-1' },
			{},
			{ toolCallId: 'call-1' },
			{},
		)

		expect(usecase.handle).toHaveBeenCalledWith({ toolCallId: 'call-1' })
		expect(output).toEqual({ toolCallId: 'call-1', approved: true })
	})
})
