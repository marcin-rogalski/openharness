import type { HookPort } from '@/application/ports/adapters/HookPort'
import type { BudgetPort } from '@/application/ports/adapters/BudgetPort'
import type { HookContext, HookResult } from '@/domain/Hook'
import type { TokenUsage } from '@/domain/TokenUsage'

interface BudgetHookPayload {
	usage: TokenUsage
}

export default class BudgetGuardHook implements HookPort {
	readonly id = 'budget-guard'
	readonly priority = 10

	constructor(private readonly budgetPort: BudgetPort) {}

	async invoke(context: HookContext, payload: unknown): Promise<HookResult> {
		const { usage } = payload as BudgetHookPayload

		const result = await this.budgetPort.check(
			context.sessionId,
			context.turnId ?? 'unknown',
			usage,
		)

		if (!result.allowed) {
			return {
				decision: 'deny',
				annotations: [],
				reason: result.reason,
			}
		}

		await this.budgetPort.recordUsage(
			context.sessionId,
			context.turnId ?? 'unknown',
			usage,
		)

		return {
			decision: 'allow',
			annotations:
				result.remainingTokens !== null
					? [{ hookId: this.id, key: 'budget_remaining', value: result.remainingTokens }]
					: [],
			reason: null,
		}
	}
}
