import { describe, expect, it } from 'vitest'
import type { HookContext } from '@/domain/Hook'
import BudgetGuardHook from './BudgetGuardHook'
import type { BudgetPort } from '@/application/ports/adapters/BudgetPort'
import type { TokenUsage } from '@/domain/TokenUsage'

function createContext(overrides: Partial<HookContext> = {}): HookContext {
	return {
		sessionId: 'session-1',
		projectId: 'project-1',
		turnId: 'turn-1',
		stepId: null,
		timestamp: '2026-01-01T00:00:00Z',
		...overrides,
	}
}

function createBudgetPort(
	allowed: boolean,
	remaining: number | null = null,
	reason: string | null = null,
): BudgetPort {
	return {
		check: async (_sessionId: string, _turnId: string, _usage: TokenUsage) => ({
			allowed,
			reason,
			remainingTokens: remaining,
		}),
		recordUsage: async () => {},
	}
}

describe('BudgetGuardHook', () => {
	it('allows when budget port allows', async () => {
		const hook = new BudgetGuardHook(createBudgetPort(true, 500))
		const result = await hook.invoke(createContext(), { usage: { inputTokens: 100, outputTokens: 100 } })

		expect(result.decision).toBe('allow')
		expect(result.annotations).toHaveLength(1)
		expect(result.annotations[0].key).toBe('budget_remaining')
		expect(result.annotations[0].value).toBe(500)
	})

	it('denies when budget port denies', async () => {
		const hook = new BudgetGuardHook(
			createBudgetPort(false, 0, 'Turn token limit exceeded: 120/100'),
		)
		const result = await hook.invoke(createContext(), { usage: { inputTokens: 60, outputTokens: 60 } })

		expect(result.decision).toBe('deny')
		expect(result.reason).toBe('Turn token limit exceeded: 120/100')
	})

	it('records usage after allowing', async () => {
		let recorded: TokenUsage | null = null
		const port: BudgetPort = {
			check: async () => ({ allowed: true, reason: null, remainingTokens: 100 }),
			recordUsage: async (_s: string, _t: string, usage: TokenUsage) => {
				recorded = usage
			},
		}
		const hook = new BudgetGuardHook(port)
		const usage = { inputTokens: 50, outputTokens: 30 }
		await hook.invoke(createContext(), { usage })

		expect(recorded).toEqual(usage)
	})

	it('has high priority (runs early)', () => {
		const hook = new BudgetGuardHook(createBudgetPort(true))
		expect(hook.priority).toBe(10)
	})

	it('uses "unknown" when turnId is null', async () => {
		let checkedTurnId: string | null = null
		const port: BudgetPort = {
			check: async (_s: string, turnId: string) => {
				checkedTurnId = turnId
				return { allowed: true, reason: null, remainingTokens: null }
			},
			recordUsage: async () => {},
		}
		const hook = new BudgetGuardHook(port)
		await hook.invoke(createContext({ turnId: null }), {
			usage: { inputTokens: 10, outputTokens: 10 },
		})

		expect(checkedTurnId).toBe('unknown')
	})

	it('returns empty annotations when remainingTokens is null', async () => {
		const hook = new BudgetGuardHook(createBudgetPort(true, null))
		const result = await hook.invoke(createContext(), {
			usage: { inputTokens: 10, outputTokens: 10 },
		})

		expect(result.decision).toBe('allow')
		expect(result.annotations).toHaveLength(0)
	})
})
