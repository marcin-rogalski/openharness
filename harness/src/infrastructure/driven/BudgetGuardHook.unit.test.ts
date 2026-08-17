import { describe, expect, it } from 'vitest'
import type { HookContext } from '@/domain/Hook'
import BudgetGuardHook, { type BudgetTracker } from './BudgetGuardHook'

function createContext(): HookContext {
	return {
		sessionId: 'session-1',
		projectId: 'project-1',
		turnId: null,
		stepId: null,
		timestamp: '2026-01-01T00:00:00Z',
	}
}

function createTracker(used: number, limit: number): BudgetTracker {
	return {
		getUsed: () => used,
		getLimit: () => limit,
	}
}

describe('BudgetGuardHook', () => {
	it('allows when budget is not exhausted', async () => {
		const hook = new BudgetGuardHook(createTracker(50, 100))
		const result = await hook.invoke(createContext(), {})

		expect(result.decision).toBe('allow')
		expect(result.annotations).toHaveLength(1)
		expect(result.annotations[0].key).toBe('budget_remaining')
		expect(result.annotations[0].value).toBe(50)
	})

	it('denies when budget is exhausted', async () => {
		const hook = new BudgetGuardHook(createTracker(100, 100))
		const result = await hook.invoke(createContext(), {})

		expect(result.decision).toBe('deny')
		expect(result.reason).toBe('Budget exhausted: 100/100')
	})

	it('denies when usage exceeds limit', async () => {
		const hook = new BudgetGuardHook(createTracker(150, 100))
		const result = await hook.invoke(createContext(), {})

		expect(result.decision).toBe('deny')
		expect(result.reason).toContain('Budget exhausted')
	})

	it('has high priority (runs early)', () => {
		const hook = new BudgetGuardHook(createTracker(0, 100))
		expect(hook.priority).toBe(10)
	})
})
