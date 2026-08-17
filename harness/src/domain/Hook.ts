export interface HookContext {
	sessionId: string
	projectId: string
	turnId: string | null
	stepId: string | null
	timestamp: string
}

export interface HookAnnotation {
	hookId: string
	key: string
	value: unknown
}

export type HookDecision = 'allow' | 'deny' | 'annotate'

export interface HookResult {
	decision: HookDecision
	annotations: HookAnnotation[]
	reason: string | null
}
