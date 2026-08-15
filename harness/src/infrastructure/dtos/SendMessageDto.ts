import { z } from 'zod'

export const SendMessageParamsDto = z.object({
	projectId: z.string().min(1),
})

export const SendMessageBodyDto = z.object({
	content: z.string().refine((value) => value.trim().length > 0, {
		message: 'content must not be empty',
	}),
})

export const AgentTimelineEntryDto = z.discriminatedUnion('type', [
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

export const SendMessageResponseDto = z.object({
	entries: z.array(AgentTimelineEntryDto),
})
