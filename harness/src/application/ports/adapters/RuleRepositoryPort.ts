import type { Rule } from '@/domain/Rule'

export interface RuleRepositoryPort {
	list(): Promise<Rule[]>
	get(id: string): Promise<Rule | null>
	create(rule: Rule): Promise<Rule>
	update(id: string, rule: Rule): Promise<Rule>
}
