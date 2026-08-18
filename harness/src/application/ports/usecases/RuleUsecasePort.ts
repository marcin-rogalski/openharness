import type { Rule } from '@/domain/Rule'

export interface ListRulesOutput {
	rules: Rule[]
}

export interface CreateRuleInput {
	rule: Rule
}

export interface CreateRuleOutput {
	rule: Rule
}

export interface UpdateRuleInput {
	id: string
	rule: Rule
}

export interface UpdateRuleOutput {
	rule: Rule
}

export interface RuleUsecasePort {
	list(): Promise<ListRulesOutput>
	create(input: CreateRuleInput): Promise<CreateRuleOutput>
	update(input: UpdateRuleInput): Promise<UpdateRuleOutput>
}
