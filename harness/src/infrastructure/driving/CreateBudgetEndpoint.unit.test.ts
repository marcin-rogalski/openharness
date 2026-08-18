import { describe, expect, it, vi } from 'vitest'
import type { BudgetUsecasePort } from '@/application/ports/usecases/BudgetUsecasePort'
import CreateBudgetEndpoint from './CreateBudgetEndpoint'

describe('CreateBudgetEndpoint', () => {
	it('exposes the POST /api/budgets contract', () => {
		const usecase = { create: vi.fn() } as BudgetUsecasePort
		const endpoint = new CreateBudgetEndpoint(usecase)

		expect(endpoint.toInfo()).toMatchObject({
			method: 'POST',
			path: '/api/budgets',
		})
	})

	it('validates input and calls the usecase', async () => {
		const budget = {
			id: 'b1',
			name: 'Default',
			tokenLimitPerTurn: 1000,
			tokenLimitPerSession: 10000,
			costLimitPerTurn: null,
			costLimitPerSession: null,
			enforcementPoint: 'pre_request' as const,
		}
		const usecase = {
			create: vi.fn().mockResolvedValue({ budget }),
		} as BudgetUsecasePort
		const endpoint = new CreateBudgetEndpoint(usecase)
		const handler = endpoint.createHandler()

		await expect(handler({}, {}, { budget }, {})).resolves.toEqual({ budget })
		expect(usecase.create).toHaveBeenCalledWith({ budget })
	})
})
