import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { Rule } from '@/domain/Rule'
import LowDbRuleRepositoryAdapter from './LowDbRuleRepositoryAdapter'
import LowDbStore from './LowDbStore'

function makeRule(overrides: Partial<Rule> = {}): Rule {
	return {
		id: 'rule-1',
		name: 'Test Rule',
		when: 'tool_call',
		condition: {},
		action: 'deny',
		guard: null,
		...overrides,
	}
}

describe('LowDbRuleRepositoryAdapter', () => {
	let dir: string
	let adapter: LowDbRuleRepositoryAdapter

	const setup = async () => {
		dir = mkdtempSync(join(tmpdir(), 'lowdb-rule-'))
		const store = new LowDbStore(join(dir, 'data.json'))
		await store.init()
		adapter = new LowDbRuleRepositoryAdapter(store)
	}

	const teardown = () => {
		rmSync(dir, { recursive: true, force: true })
	}

	it('returns empty list initially', async () => {
		await setup()
		expect(await adapter.list()).toEqual([])
		teardown()
	})

	it('creates and retrieves a rule', async () => {
		await setup()
		const rule = makeRule()
		await adapter.create(rule)

		expect(await adapter.get('rule-1')).toEqual(rule)
		expect(await adapter.list()).toHaveLength(1)
		teardown()
	})

	it('returns null for non-existent rule', async () => {
		await setup()
		expect(await adapter.get('missing')).toBeNull()
		teardown()
	})

	it('updates an existing rule', async () => {
		await setup()
		const rule = makeRule()
		await adapter.create(rule)

		const updated = makeRule({ action: 'allow' })
		await adapter.update('rule-1', updated)

		expect(await adapter.get('rule-1')).toEqual(updated)
		teardown()
	})

	it('throws when updating non-existent rule', async () => {
		await setup()
		await expect(adapter.update('missing', makeRule())).rejects.toThrow(
			'Rule not found: missing',
		)
		teardown()
	})

})
