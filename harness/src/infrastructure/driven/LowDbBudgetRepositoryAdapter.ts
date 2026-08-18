import type { BudgetRepositoryPort } from '@/application/ports/adapters/BudgetRepositoryPort'
import type { Budget } from '@/domain/Budget'
import type LowDbStore from './LowDbStore'

export default class LowDbBudgetRepositoryAdapter
	implements BudgetRepositoryPort
{
	constructor(private readonly store: LowDbStore) {}

	async list(): Promise<Budget[]> {
		return [...this.store.db.data.budgets]
	}

	async get(id: string): Promise<Budget | null> {
		return this.store.db.data.budgets.find((b) => b.id === id) ?? null
	}

	async create(budget: Budget): Promise<Budget> {
		this.store.db.data.budgets.push(budget)
		await this.store.persist()
		return budget
	}

	async update(id: string, budget: Budget): Promise<Budget> {
		const index = this.store.db.data.budgets.findIndex((b) => b.id === id)
		if (index === -1) {
			throw new Error(`Budget not found: ${id}`)
		}
		this.store.db.data.budgets[index] = budget
		await this.store.persist()
		return budget
	}
}
