import type { TokenUsage } from '@/domain/TokenUsage'

export interface BudgetCheckResult {
	allowed: boolean
	reason: string | null
	remainingTokens: number | null
}

export interface BudgetPort {
	check(sessionId: string, turnId: string, usage: TokenUsage): Promise<BudgetCheckResult>
	recordUsage(sessionId: string, turnId: string, usage: TokenUsage): Promise<void>
}
