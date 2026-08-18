import { describe, expect, it } from 'vitest'
import InMemoryBudgetAdapter from '@/infrastructure/driven/InMemoryBudgetAdapter'
import type { Budget } from '@/domain/Budget'

function makeBudget(overrides: Partial<Budget> = {}): Budget {
	return {
		id: 'budget-1',
		name: 'test-budget',
		tokenLimitPerTurn: 1000,
		tokenLimitPerSession: 5000,
		costLimitPerTurn: null,
		costLimitPerSession: null,
		enforcementPoint: 'pre_request',
		...overrides,
	}
}

describe('InMemoryBudgetAdapter', () => {
	it('allows when usage is within limits', async () => {
		const adapter = new InMemoryBudgetAdapter(makeBudget())
		const result = await adapter.check('session-1', 'turn-1', {
			inputTokens: 100,
			outputTokens: 100,
		})
		expect(result.allowed).toBe(true)
		expect(result.reason).toBeNull()
		expect(result.remainingTokens).toBe(800)
	})

	it('denies when turn token limit is exceeded', async () => {
		const adapter = new InMemoryBudgetAdapter(makeBudget({ tokenLimitPerTurn: 100 }))
		const result = await adapter.check('session-1', 'turn-1', {
			inputTokens: 60,
			outputTokens: 60,
		})
		expect(result.allowed).toBe(false)
		expect(result.reason).toContain('Turn')
	})

	it('denies when session token limit is exceeded', async () => {
		const adapter = new InMemoryBudgetAdapter(
			makeBudget({ tokenLimitPerTurn: null, tokenLimitPerSession: 100 }),
		)
		await adapter.recordUsage('session-1', 'turn-1', { inputTokens: 60, outputTokens: 20 })
		const result = await adapter.check('session-1', 'turn-2', {
			inputTokens: 40,
			outputTokens: 40,
		})
		expect(result.allowed).toBe(false)
		expect(result.reason).toContain('Session')
	})

	it('allows when no limits are set', async () => {
		const adapter = new InMemoryBudgetAdapter(
			makeBudget({
				tokenLimitPerTurn: null,
				tokenLimitPerSession: null,
				costLimitPerTurn: null,
				costLimitPerSession: null,
			}),
		)
		const result = await adapter.check('session-1', 'turn-1', {
			inputTokens: 999999,
			outputTokens: 999999,
		})
		expect(result.allowed).toBe(true)
	})

	it('tracks usage across turns within a session', async () => {
		const adapter = new InMemoryBudgetAdapter(
			makeBudget({ tokenLimitPerTurn: null, tokenLimitPerSession: 200 }),
		)
		await adapter.recordUsage('session-1', 'turn-1', { inputTokens: 50, outputTokens: 50 })
		await adapter.recordUsage('session-1', 'turn-2', { inputTokens: 50, outputTokens: 50 })
		const result = await adapter.check('session-1', 'turn-3', {
			inputTokens: 60,
			outputTokens: 60,
		})
		expect(result.allowed).toBe(false)
	})

	it('tracks usage per turn independently', async () => {
		const adapter = new InMemoryBudgetAdapter(
			makeBudget({ tokenLimitPerTurn: 100, tokenLimitPerSession: null }),
		)
		await adapter.recordUsage('session-1', 'turn-1', { inputTokens: 40, outputTokens: 40 })
		const result = await adapter.check('session-1', 'turn-2', {
			inputTokens: 40,
			outputTokens: 40,
		})
		expect(result.allowed).toBe(true)
	})
})
