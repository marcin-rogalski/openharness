import type { BudgetPort, BudgetCheckResult } from '@/application/ports/adapters/BudgetPort'
import type { Budget } from '@/domain/Budget'
import type { TokenUsage } from '@/domain/TokenUsage'

interface SessionUsage {
	turns: Map<string, number>
	total: number
}

export default class InMemoryBudgetAdapter implements BudgetPort {
	private readonly budget: Budget
	private readonly sessions = new Map<string, SessionUsage>()

	constructor(budget: Budget) {
		this.budget = budget
	}

	async check(
		sessionId: string,
		turnId: string,
		usage: TokenUsage,
	): Promise<BudgetCheckResult> {
		const tokens = usage.inputTokens + usage.outputTokens
		const session = this.sessions.get(sessionId)
		const currentTurnUsage = session?.turns.get(turnId) ?? 0
		const projectedTurn = currentTurnUsage + tokens
		const projectedSession = (session?.total ?? 0) + tokens

		if (this.budget.tokenLimitPerTurn !== null) {
			if (projectedTurn > this.budget.tokenLimitPerTurn) {
				return {
					allowed: false,
					reason: `Turn token limit exceeded: ${projectedTurn}/${this.budget.tokenLimitPerTurn}`,
					remainingTokens: 0,
				}
			}
		}

		if (this.budget.tokenLimitPerSession !== null) {
			if (projectedSession > this.budget.tokenLimitPerSession) {
				return {
					allowed: false,
					reason: `Session token limit exceeded: ${projectedSession}/${this.budget.tokenLimitPerSession}`,
					remainingTokens: 0,
				}
			}
		}

		const remaining =
			this.budget.tokenLimitPerTurn !== null
				? this.budget.tokenLimitPerTurn - projectedTurn
				: this.budget.tokenLimitPerSession !== null
					? this.budget.tokenLimitPerSession - projectedSession
					: null

		return {
			allowed: true,
			reason: null,
			remainingTokens: remaining,
		}
	}

	async recordUsage(sessionId: string, turnId: string, usage: TokenUsage): Promise<void> {
		const tokens = usage.inputTokens + usage.outputTokens
		let session = this.sessions.get(sessionId)
		if (!session) {
			session = { turns: new Map(), total: 0 }
			this.sessions.set(sessionId, session)
		}
		session.turns.set(turnId, (session.turns.get(turnId) ?? 0) + tokens)
		session.total += tokens
	}
}
