import type { RuleRepositoryPort } from '@/application/ports/adapters/RuleRepositoryPort'
import type { Rule } from '@/domain/Rule'

export default class InMemoryRuleRepositoryAdapter implements RuleRepositoryPort {
	private readonly rules = new Map<string, Rule>()

	async list(): Promise<Rule[]> {
		return [...this.rules.values()]
	}

	async get(id: string): Promise<Rule | null> {
		return this.rules.get(id) ?? null
	}

	async create(rule: Rule): Promise<Rule> {
		this.rules.set(rule.id, rule)
		return rule
	}

	async update(id: string, rule: Rule): Promise<Rule> {
		if (!this.rules.has(id)) {
			throw new Error(`Rule not found: ${id}`)
		}
		this.rules.set(id, rule)
		return rule
	}
}
