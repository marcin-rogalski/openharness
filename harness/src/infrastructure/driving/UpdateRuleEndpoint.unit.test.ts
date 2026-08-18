import { describe, expect, it, vi } from 'vitest'
import type { RuleUsecasePort } from '@/application/ports/usecases/RuleUsecasePort'
import UpdateRuleEndpoint from './UpdateRuleEndpoint'

describe('UpdateRuleEndpoint', () => {
	it('exposes the PUT /api/rules contract', () => {
		const usecase = { update: vi.fn() } as RuleUsecasePort
		const endpoint = new UpdateRuleEndpoint(usecase)

		expect(endpoint.toInfo()).toMatchObject({
			method: 'PUT',
			path: '/api/rules',
		})
	})

	it('validates input and calls the usecase', async () => {
		const rule = {
			id: 'r1',
			name: 'Block rm',
			when: 'tool_call' as const,
			condition: { toolId: 'bash' },
			action: 'require_approval' as const,
			guard: 'human',
		}
		const usecase = {
			update: vi.fn().mockResolvedValue({ rule }),
		} as RuleUsecasePort
		const endpoint = new UpdateRuleEndpoint(usecase)
		const handler = endpoint.createHandler()

		await expect(handler({}, {}, { id: 'r1', rule }, {})).resolves.toEqual({ rule })
		expect(usecase.update).toHaveBeenCalledWith({ id: 'r1', rule })
	})
})
