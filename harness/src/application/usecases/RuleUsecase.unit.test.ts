import { describe, expect, it } from 'vitest'
import RuleUsecase from '@/application/usecases/RuleUsecase'
import InMemoryRuleRepositoryAdapter from '@/infrastructure/driven/InMemoryRuleRepositoryAdapter'
import type { Rule } from '@/domain/Rule'

function makeRule(overrides: Partial<Rule> = {}): Rule {
	return {
		id: 'rule-1',
		name: 'test-rule',
		when: 'tool_call',
		condition: { tool: 'bash' },
		action: 'require_approval',
		guard: null,
		...overrides,
	}
}

describe('RuleUsecase', () => {
	it('lists rules', async () => {
		const repo = new InMemoryRuleRepositoryAdapter()
		await repo.create(makeRule())
		const usecase = new RuleUsecase(repo)
		const result = await usecase.list()
		expect(result.rules).toHaveLength(1)
	})

	it('creates a rule', async () => {
		const repo = new InMemoryRuleRepositoryAdapter()
		const usecase = new RuleUsecase(repo)
		const result = await usecase.create({ rule: makeRule() })
		expect(result.rule.id).toBe('rule-1')
	})

	it('updates a rule', async () => {
		const repo = new InMemoryRuleRepositoryAdapter()
		await repo.create(makeRule())
		const usecase = new RuleUsecase(repo)
		const result = await usecase.update({ id: 'rule-1', rule: makeRule({ action: 'deny' }) })
		expect(result.rule.action).toBe('deny')
	})
})
