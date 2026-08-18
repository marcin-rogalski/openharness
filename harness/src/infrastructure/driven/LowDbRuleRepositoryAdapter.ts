import type { RuleRepositoryPort } from '@/application/ports/adapters/RuleRepositoryPort'
import type { Rule } from '@/domain/Rule'
import type LowDbStore from './LowDbStore'

export default class LowDbRuleRepositoryAdapter implements RuleRepositoryPort {
	constructor(private readonly store: LowDbStore) {}

	async list(): Promise<Rule[]> {
		return [...this.store.db.data.rules]
	}

	async get(id: string): Promise<Rule | null> {
		return this.store.db.data.rules.find((r) => r.id === id) ?? null
	}

	async create(rule: Rule): Promise<Rule> {
		this.store.db.data.rules.push(rule)
		await this.store.persist()
		return rule
	}

	async update(id: string, rule: Rule): Promise<Rule> {
		const index = this.store.db.data.rules.findIndex((r) => r.id === id)
		if (index === -1) {
			throw new Error(`Rule not found: ${id}`)
		}
		this.store.db.data.rules[index] = rule
		await this.store.persist()
		return rule
	}
}
