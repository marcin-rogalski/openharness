import type { RuleRepositoryPort } from '@/application/ports/adapters/RuleRepositoryPort'
import type {
	CreateRuleInput,
	CreateRuleOutput,
	ListRulesOutput,
	RuleUsecasePort,
	UpdateRuleInput,
	UpdateRuleOutput,
} from '@/application/ports/usecases/RuleUsecasePort'

export default class RuleUsecase implements RuleUsecasePort {
	constructor(private readonly repository: RuleRepositoryPort) {}

	async list(): Promise<ListRulesOutput> {
		return { rules: await this.repository.list() }
	}

	async create(input: CreateRuleInput): Promise<CreateRuleOutput> {
		return { rule: await this.repository.create(input.rule) }
	}

	async update(input: UpdateRuleInput): Promise<UpdateRuleOutput> {
		return { rule: await this.repository.update(input.id, input.rule) }
	}
}
