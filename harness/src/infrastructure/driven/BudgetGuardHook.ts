import type { HookPort } from '@/application/ports/adapters/HookPort'
import type { HookContext, HookResult } from '@/domain/Hook'

export interface BudgetTracker {
	getUsed(): number
	getLimit(): number
}

export default class BudgetGuardHook implements HookPort {
	readonly id = 'budget-guard'
	readonly priority = 10

	constructor(private readonly tracker: BudgetTracker) {}

	async invoke(_context: HookContext, _payload: unknown): Promise<HookResult> {
		const used = this.tracker.getUsed()
		const limit = this.tracker.getLimit()

		if (used >= limit) {
			return {
				decision: 'deny',
				annotations: [],
				reason: `Budget exhausted: ${used}/${limit}`,
			}
		}

		return {
			decision: 'allow',
			annotations: [
				{
					hookId: this.id,
					key: 'budget_remaining',
					value: limit - used,
				},
			],
			reason: null,
		}
	}
}
