import { describe, expect, it } from 'vitest'
import BudgetUsecase from '@/application/usecases/BudgetUsecase'
import InMemoryBudgetRepositoryAdapter from '@/infrastructure/driven/InMemoryBudgetRepositoryAdapter'
import type { Budget } from '@/domain/Budget'

function makeBudget(overrides: Partial<Budget> = {}): Budget {
	return {
		id: 'budget-1',
		name: 'test-budget',
		tokenLimitPerTurn: 1000,
		tokenLimitPerSession: 5000,
		costLimitPerTurn: null,
		costLimitPerSession: null,
		enforcementPoint: 'pre_request',
		...overrides,
	}
}

describe('BudgetUsecase', () => {
	it('lists budgets', async () => {
		const repo = new InMemoryBudgetRepositoryAdapter()
		await repo.create(makeBudget())
		const usecase = new BudgetUsecase(repo)
		const result = await usecase.list()
		expect(result.budgets).toHaveLength(1)
	})

	it('creates a budget', async () => {
		const repo = new InMemoryBudgetRepositoryAdapter()
		const usecase = new BudgetUsecase(repo)
		const result = await usecase.create({ budget: makeBudget() })
		expect(result.budget.id).toBe('budget-1')
	})

	it('updates a budget', async () => {
		const repo = new InMemoryBudgetRepositoryAdapter()
		await repo.create(makeBudget())
		const usecase = new BudgetUsecase(repo)
		const result = await usecase.update({
			id: 'budget-1',
			budget: makeBudget({ tokenLimitPerTurn: 2000 }),
		})
		expect(result.budget.tokenLimitPerTurn).toBe(2000)
	})
})
