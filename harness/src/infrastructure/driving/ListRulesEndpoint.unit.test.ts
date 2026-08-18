import { describe, expect, it, vi } from 'vitest'
import type { RuleUsecasePort } from '@/application/ports/usecases/RuleUsecasePort'
import ListRulesEndpoint from './ListRulesEndpoint'

describe('ListRulesEndpoint', () => {
	it('exposes the GET /api/rules contract', () => {
		const usecase = { list: vi.fn() } as RuleUsecasePort
		const endpoint = new ListRulesEndpoint(usecase)

		expect(endpoint.toInfo()).toMatchObject({
			method: 'GET',
			path: '/api/rules',
		})
	})

	it('calls the usecase and returns rules', async () => {
		const rules = [
			{
				id: 'r1',
				name: 'Block rm',
				when: 'tool_call' as const,
				condition: { toolId: 'bash' },
				action: 'deny' as const,
				guard: null,
			},
		]
		const usecase = {
			list: vi.fn().mockResolvedValue({ rules }),
		} as RuleUsecasePort
		const endpoint = new ListRulesEndpoint(usecase)
		const handler = endpoint.createHandler()

		await expect(handler({}, {}, {}, {})).resolves.toEqual({ rules })
		expect(usecase.list).toHaveBeenCalledOnce()
	})
})
