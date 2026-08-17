export type ToolCallStatus =
	| 'pending'
	| 'approved'
	| 'denied'
	| 'executing'
	| 'completed'
	| 'failed'

export interface ToolCall {
	id: string
	sessionId: string
	toolId: string
	input: Record<string, unknown>
	status: ToolCallStatus
	createdAt: string
}
