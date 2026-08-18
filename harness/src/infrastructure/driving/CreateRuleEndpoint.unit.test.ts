import { describe, expect, it, vi } from 'vitest'
import type { RuleUsecasePort } from '@/application/ports/usecases/RuleUsecasePort'
import CreateRuleEndpoint from './CreateRuleEndpoint'

describe('CreateRuleEndpoint', () => {
	it('exposes the POST /api/rules contract', () => {
		const usecase = { create: vi.fn() } as RuleUsecasePort
		const endpoint = new CreateRuleEndpoint(usecase)

		expect(endpoint.toInfo()).toMatchObject({
			method: 'POST',
			path: '/api/rules',
		})
	})

	it('validates input and calls the usecase', async () => {
		const rule = {
			id: 'r1',
			name: 'Block rm',
			when: 'tool_call' as const,
			condition: { toolId: 'bash' },
			action: 'deny' as const,
			guard: null,
		}
		const usecase = {
			create: vi.fn().mockResolvedValue({ rule }),
		} as RuleUsecasePort
		const endpoint = new CreateRuleEndpoint(usecase)
		const handler = endpoint.createHandler()

		await expect(handler({}, {}, { rule }, {})).resolves.toEqual({ rule })
		expect(usecase.create).toHaveBeenCalledWith({ rule })
	})
})
