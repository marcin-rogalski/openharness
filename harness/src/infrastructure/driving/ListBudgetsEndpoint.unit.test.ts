import { describe, expect, it, vi } from 'vitest'
import type { BudgetUsecasePort } from '@/application/ports/usecases/BudgetUsecasePort'
import ListBudgetsEndpoint from './ListBudgetsEndpoint'

describe('ListBudgetsEndpoint', () => {
	it('exposes the GET /api/budgets contract', () => {
		const usecase = { list: vi.fn() } as BudgetUsecasePort
		const endpoint = new ListBudgetsEndpoint(usecase)

		expect(endpoint.toInfo()).toMatchObject({
			method: 'GET',
			path: '/api/budgets',
		})
	})

	it('calls the usecase and returns budgets', async () => {
		const budgets = [
			{
				id: 'b1',
				name: 'Default',
				tokenLimitPerTurn: 1000,
				tokenLimitPerSession: 10000,
				costLimitPerTurn: null,
				costLimitPerSession: null,
				enforcementPoint: 'pre_request' as const,
			},
		]
		const usecase = {
			list: vi.fn().mockResolvedValue({ budgets }),
		} as BudgetUsecasePort
		const endpoint = new ListBudgetsEndpoint(usecase)
		const handler = endpoint.createHandler()

		await expect(handler({}, {}, {}, {})).resolves.toEqual({ budgets })
		expect(usecase.list).toHaveBeenCalledOnce()
	})
})
