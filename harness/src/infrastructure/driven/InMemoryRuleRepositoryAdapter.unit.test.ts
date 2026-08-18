import { describe, expect, it } from 'vitest'
import InMemoryRuleRepositoryAdapter from './InMemoryRuleRepositoryAdapter'
import type { Rule } from '@/domain/Rule'

const rule: Rule = {
	id: 'r1',
	name: 'Block rm',
	when: 'tool_call',
	condition: { toolId: 'bash' },
	action: 'deny',
	guard: null,
}

describe('InMemoryRuleRepositoryAdapter', () => {
	it('returns a stored rule', async () => {
		const repo = new InMemoryRuleRepositoryAdapter()
		await repo.create(rule)

		await expect(repo.get('r1')).resolves.toEqual(rule)
	})

	it('returns null when the rule is missing', async () => {
		const repo = new InMemoryRuleRepositoryAdapter()

		await expect(repo.get('missing')).resolves.toBeNull()
	})

	it('lists all stored rules', async () => {
		const repo = new InMemoryRuleRepositoryAdapter()
		await repo.create(rule)

		await expect(repo.list()).resolves.toEqual([rule])
	})

	it('creates a rule', async () => {
		const repo = new InMemoryRuleRepositoryAdapter()

		await expect(repo.create(rule)).resolves.toEqual(rule)
	})

	it('updates an existing rule', async () => {
		const repo = new InMemoryRuleRepositoryAdapter()
		await repo.create(rule)
		const updated = { ...rule, action: 'require_approval' as const }

		await expect(repo.update('r1', updated)).resolves.toEqual(updated)
	})

	it('throws when updating a missing rule', async () => {
		const repo = new InMemoryRuleRepositoryAdapter()

		await expect(repo.update('missing', rule)).rejects.toThrow(
			'Rule not found: missing',
		)
	})
})
