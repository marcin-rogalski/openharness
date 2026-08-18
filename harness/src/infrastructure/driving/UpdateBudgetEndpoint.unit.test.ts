import { describe, expect, it, vi } from 'vitest'
import type { BudgetUsecasePort } from '@/application/ports/usecases/BudgetUsecasePort'
import UpdateBudgetEndpoint from './UpdateBudgetEndpoint'

describe('UpdateBudgetEndpoint', () => {
	it('exposes the PUT /api/budgets contract', () => {
		const usecase = { update: vi.fn() } as BudgetUsecasePort
		const endpoint = new UpdateBudgetEndpoint(usecase)

		expect(endpoint.toInfo()).toMatchObject({
			method: 'PUT',
			path: '/api/budgets',
		})
	})

	it('validates input and calls the usecase', async () => {
		const budget = {
			id: 'b1',
			name: 'Default',
			tokenLimitPerTurn: 2000,
			tokenLimitPerSession: 20000,
			costLimitPerTurn: null,
			costLimitPerSession: null,
			enforcementPoint: 'post_response' as const,
		}
		const usecase = {
			update: vi.fn().mockResolvedValue({ budget }),
		} as BudgetUsecasePort
		const endpoint = new UpdateBudgetEndpoint(usecase)
		const handler = endpoint.createHandler()

		await expect(handler({}, {}, { id: 'b1', budget }, {})).resolves.toEqual({
			budget,
		})
		expect(usecase.update).toHaveBeenCalledWith({ id: 'b1', budget })
	})
})
