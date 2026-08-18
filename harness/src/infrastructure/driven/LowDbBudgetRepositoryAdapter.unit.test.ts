import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { Budget } from '@/domain/Budget'
import LowDbBudgetRepositoryAdapter from './LowDbBudgetRepositoryAdapter'
import LowDbStore from './LowDbStore'

function makeBudget(overrides: Partial<Budget> = {}): Budget {
	return {
		id: 'budget-1',
		name: 'Test Budget',
		tokenLimitPerTurn: 1000,
		tokenLimitPerSession: 10000,
		costLimitPerTurn: null,
		costLimitPerSession: null,
		enforcementPoint: 'pre_request',
		...overrides,
	}
}

describe('LowDbBudgetRepositoryAdapter', () => {
	let dir: string
	let adapter: LowDbBudgetRepositoryAdapter

	const setup = async () => {
		dir = mkdtempSync(join(tmpdir(), 'lowdb-budget-'))
		const store = new LowDbStore(join(dir, 'data.json'))
		await store.init()
		adapter = new LowDbBudgetRepositoryAdapter(store)
	}

	const teardown = () => {
		rmSync(dir, { recursive: true, force: true })
	}

	it('returns empty list initially', async () => {
		await setup()
		expect(await adapter.list()).toEqual([])
		teardown()
	})

	it('creates and retrieves a budget', async () => {
		await setup()
		const budget = makeBudget()
		await adapter.create(budget)

		expect(await adapter.get('budget-1')).toEqual(budget)
		expect(await adapter.list()).toHaveLength(1)
		teardown()
	})

	it('returns null for non-existent budget', async () => {
		await setup()
		expect(await adapter.get('missing')).toBeNull()
		teardown()
	})

	it('updates an existing budget', async () => {
		await setup()
		const budget = makeBudget()
		await adapter.create(budget)

		const updated = makeBudget({ tokenLimitPerTurn: 5000 })
		await adapter.update('budget-1', updated)

		expect(await adapter.get('budget-1')).toEqual(updated)
		teardown()
	})

	it('throws when updating non-existent budget', async () => {
		await setup()
		await expect(
			adapter.update('missing', makeBudget()),
		).rejects.toThrow('Budget not found: missing')
		teardown()
	})

})
