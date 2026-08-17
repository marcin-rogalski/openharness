export type SessionEventActor = 'user' | 'agent' | 'system'

export type SessionEventVisibility = 'user' | 'model' | 'both'

export type SessionEventType =
	| 'session_created'
	| 'user_message'
	| 'context_injected'
	| 'steering_received'
	| 'turn_started'
	| 'step_started'
	| 'model_request_sent'
	| 'model_output_received'
	| 'tool_call_requested'
	| 'tool_execution_started'
	| 'tool_result_produced'
	| 'approval_requested'
	| 'approval_decided'
	| 'sandbox_mode_changed'
	| 'error_occurred'
	| 'turn_ended'
	| 'session_ended'

export interface SessionEvent {
	id: string
	sessionId: string
	projectId: string
	turnId: string | null
	stepId: string | null
	timestamp: string
	actor: SessionEventActor
	type: SessionEventType
	payload: Record<string, unknown>
	visibility: SessionEventVisibility
}
