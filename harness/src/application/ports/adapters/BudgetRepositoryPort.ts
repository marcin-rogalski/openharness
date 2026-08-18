import type { Budget } from '@/domain/Budget'

export interface BudgetRepositoryPort {
	list(): Promise<Budget[]>
	get(id: string): Promise<Budget | null>
	create(budget: Budget): Promise<Budget>
	update(id: string, budget: Budget): Promise<Budget>
}
