import type { Budget } from '@/domain/Budget'

export interface ListBudgetsOutput {
	budgets: Budget[]
}

export interface CreateBudgetInput {
	budget: Budget
}

export interface CreateBudgetOutput {
	budget: Budget
}

export interface UpdateBudgetInput {
	id: string
	budget: Budget
}

export interface UpdateBudgetOutput {
	budget: Budget
}

export interface BudgetUsecasePort {
	list(): Promise<ListBudgetsOutput>
	create(input: CreateBudgetInput): Promise<CreateBudgetOutput>
	update(input: UpdateBudgetInput): Promise<UpdateBudgetOutput>
}
