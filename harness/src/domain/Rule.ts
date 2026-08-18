export type RuleTrigger =
	| 'tool_call'
	| 'turn_start'
	| 'turn_end'
	| 'step_start'
	| 'step_end'
	| 'session_start'
	| 'session_end'

export type RuleAction = 'allow' | 'deny' | 'require_approval' | 'annotate'

export interface Rule {
	id: string
	name: string
	when: RuleTrigger
	condition: Record<string, unknown>
	action: RuleAction
	guard: string | null
}
