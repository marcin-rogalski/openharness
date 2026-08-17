import { z } from 'zod'

export const SessionEventTypeSchema = z.enum([
	'session_created',
	'user_message',
	'context_injected',
	'steering_received',
	'turn_started',
	'step_started',
	'model_request_sent',
	'model_output_received',
	'tool_call_requested',
	'tool_execution_started',
	'tool_result_produced',
	'approval_requested',
	'approval_decided',
	'sandbox_mode_changed',
	'error_occurred',
	'turn_ended',
	'session_ended',
])

export const SessionEventSchema = z.object({
	id: z.string(),
	sessionId: z.string(),
	projectId: z.string(),
	turnId: z.string().nullable(),
	stepId: z.string().nullable(),
	timestamp: z.string(),
	actor: z.enum(['user', 'agent', 'system']),
	type: SessionEventTypeSchema,
	payload: z.record(z.string(), z.unknown()),
	visibility: z.enum(['user', 'model', 'both']),
})

export type SessionEventType = z.infer<typeof SessionEventTypeSchema>
export type SessionEvent = z.infer<typeof SessionEventSchema>
