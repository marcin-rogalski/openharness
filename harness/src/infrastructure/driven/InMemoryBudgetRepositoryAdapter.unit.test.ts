import { describe, expect, it } from 'vitest'
import InMemoryBudgetRepositoryAdapter from './InMemoryBudgetRepositoryAdapter'
import type { Budget } from '@/domain/Budget'

const budget: Budget = {
	id: 'b1',
	name: 'Default',
	tokenLimitPerTurn: 1000,
	tokenLimitPerSession: 10000,
	costLimitPerTurn: null,
	costLimitPerSession: null,
	enforcementPoint: 'pre_request',
}

describe('InMemoryBudgetRepositoryAdapter', () => {
	it('returns a stored budget', async () => {
		const repo = new InMemoryBudgetRepositoryAdapter()
		await repo.create(budget)

		await expect(repo.get('b1')).resolves.toEqual(budget)
	})

	it('returns null when the budget is missing', async () => {
		const repo = new InMemoryBudgetRepositoryAdapter()

		await expect(repo.get('missing')).resolves.toBeNull()
	})

	it('lists all stored budgets', async () => {
		const repo = new InMemoryBudgetRepositoryAdapter()
		await repo.create(budget)

		await expect(repo.list()).resolves.toEqual([budget])
	})

	it('creates a budget', async () => {
		const repo = new InMemoryBudgetRepositoryAdapter()

		await expect(repo.create(budget)).resolves.toEqual(budget)
	})

	it('updates an existing budget', async () => {
		const repo = new InMemoryBudgetRepositoryAdapter()
		await repo.create(budget)
		const updated = { ...budget, tokenLimitPerTurn: 2000 }

		await expect(repo.update('b1', updated)).resolves.toEqual(updated)
	})

	it('throws when updating a missing budget', async () => {
		const repo = new InMemoryBudgetRepositoryAdapter()

		await expect(repo.update('missing', budget)).rejects.toThrow(
			'Budget not found: missing',
		)
	})
})
