import type { EndpointSchema } from '@openharness/fetch'
import { z } from 'zod'

export const ApproveToolCallBodySchema = z.object({
	toolCallId: z.string().min(1),
})

export const ApproveToolCallResponseSchema = z.object({
	toolCallId: z.string(),
	approved: z.boolean(),
})

export const approveToolCallEndpoint = {
	method: 'POST' as const,
	path: '/api/tool-calls/:toolCallId/approve',
	params: z.object({ toolCallId: z.string().min(1) }),
	body: ApproveToolCallBodySchema,
	response: ApproveToolCallResponseSchema,
} satisfies EndpointSchema

export const DenyToolCallBodySchema = z.object({
	toolCallId: z.string().min(1),
})

export const DenyToolCallResponseSchema = z.object({
	toolCallId: z.string(),
	denied: z.boolean(),
})

export const denyToolCallEndpoint = {
	method: 'POST' as const,
	path: '/api/tool-calls/:toolCallId/deny',
	params: z.object({ toolCallId: z.string().min(1) }),
	body: DenyToolCallBodySchema,
	response: DenyToolCallResponseSchema,
} satisfies EndpointSchema
