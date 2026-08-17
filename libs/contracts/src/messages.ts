import type { EndpointSchema } from '@openharness/fetch'
import { z } from 'zod'
import { SessionEventSchema } from './events'

export const TimelineEntrySchema = z.discriminatedUnion('type', [
	z.object({
		type: z.literal('user_message'),
		id: z.string(),
		projectId: z.string(),
		content: z.string(),
	}),
	z.object({
		type: z.literal('agent_thinking'),
		id: z.string(),
		projectId: z.string(),
		text: z.string(),
	}),
	z.object({
		type: z.literal('agent_tool_call'),
		id: z.string(),
		projectId: z.string(),
		tool: z.string(),
		status: z.enum(['started', 'completed']),
		input: z.string().optional(),
		output: z.string().optional(),
	}),
	z.object({
		type: z.literal('agent_response'),
		id: z.string(),
		projectId: z.string(),
		text: z.string(),
	}),
])

export const SendMessageParamsSchema = z.object({
	projectId: z.string().min(1),
})

export const SendMessageBodySchema = z.object({
	content: z.string().refine((value) => value.trim().length > 0, {
		message: 'content must not be empty',
	}),
})

export const SendMessageResponseSchema = z.object({
	sessionId: z.string(),
	events: z.array(SessionEventSchema),
})

export const sendMessageEndpoint = {
	method: 'POST' as const,
	path: '/api/projects/:projectId/messages',
	params: SendMessageParamsSchema,
	body: SendMessageBodySchema,
	response: SendMessageResponseSchema,
} satisfies EndpointSchema
