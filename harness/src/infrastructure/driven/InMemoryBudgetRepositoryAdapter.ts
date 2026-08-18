import type { BudgetRepositoryPort } from '@/application/ports/adapters/BudgetRepositoryPort'
import type { Budget } from '@/domain/Budget'

export default class InMemoryBudgetRepositoryAdapter implements BudgetRepositoryPort {
	private readonly budgets = new Map<string, Budget>()

	async list(): Promise<Budget[]> {
		return [...this.budgets.values()]
	}

	async get(id: string): Promise<Budget | null> {
		return this.budgets.get(id) ?? null
	}

	async create(budget: Budget): Promise<Budget> {
		this.budgets.set(budget.id, budget)
		return budget
	}

	async update(id: string, budget: Budget): Promise<Budget> {
		if (!this.budgets.has(id)) {
			throw new Error(`Budget not found: ${id}`)
		}
		this.budgets.set(id, budget)
		return budget
	}
}
