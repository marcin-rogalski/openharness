import type { BudgetRepositoryPort } from '@/application/ports/adapters/BudgetRepositoryPort'
import type {
	BudgetUsecasePort,
	CreateBudgetInput,
	CreateBudgetOutput,
	ListBudgetsOutput,
	UpdateBudgetInput,
	UpdateBudgetOutput,
} from '@/application/ports/usecases/BudgetUsecasePort'

export default class BudgetUsecase implements BudgetUsecasePort {
	constructor(private readonly repository: BudgetRepositoryPort) {}

	async list(): Promise<ListBudgetsOutput> {
		return { budgets: await this.repository.list() }
	}

	async create(input: CreateBudgetInput): Promise<CreateBudgetOutput> {
		return { budget: await this.repository.create(input.budget) }
	}

	async update(input: UpdateBudgetInput): Promise<UpdateBudgetOutput> {
		return { budget: await this.repository.update(input.id, input.budget) }
	}
}
