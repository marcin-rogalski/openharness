import { describe, expect, it, vi } from 'vitest'
import type { SendProjectMessageUseCasePort } from '@/application/ports/usecases/SendProjectMessageUseCasePort'
import SendProjectMessageEndpoint from './SendProjectMessageEndpoint'

describe('SendProjectMessageEndpoint', () => {
	it('exposes the POST /api/projects/:projectId/messages contract', () => {
		const usecase = { handle: vi.fn() } as SendProjectMessageUseCasePort
		const endpoint = new SendProjectMessageEndpoint(usecase)

		expect(endpoint.toInfo()).toMatchObject({
			method: 'POST',
			path: '/api/projects/:projectId/messages',
		})
	})

	it('validates input and calls the usecase', async () => {
		const usecase = {
			handle: vi.fn().mockResolvedValue({ entries: [] }),
		} as SendProjectMessageUseCasePort
		const endpoint = new SendProjectMessageEndpoint(usecase)
		const handler = endpoint.createHandler()

		const output = await handler(
			{ projectId: 'project-1' },
			{},
			{ content: 'Hello' },
			{},
		)

		expect(usecase.handle).toHaveBeenCalledWith({
			projectId: 'project-1',
			content: 'Hello',
		})
		expect(output).toEqual({ entries: [] })
	})

	it('rejects an empty message body', async () => {
		const usecase = { handle: vi.fn() } as SendProjectMessageUseCasePort
		const endpoint = new SendProjectMessageEndpoint(usecase)
		const handler = endpoint.createHandler()

		await expect(
			handler({ projectId: 'project-1' }, {}, { content: '   ' }, {}),
		).rejects.toThrow()
		expect(usecase.handle).not.toHaveBeenCalled()
	})
})
