export type BudgetEnforcementPoint = 'pre_request' | 'post_response'

export interface Budget {
	id: string
	name: string
	tokenLimitPerTurn: number | null
	tokenLimitPerSession: number | null
	costLimitPerTurn: number | null
	costLimitPerSession: number | null
	enforcementPoint: BudgetEnforcementPoint
}
