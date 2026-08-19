import type { EndpointSchema } from '@openharness/fetch'
import { z } from 'zod'

export const SessionSchema = z.object({
	id: z.string(),
	projectId: z.string(),
	status: z.enum(['active', 'ended']),
	createdAt: z.string(),
	endedAt: z.string().nullable(),
})

export const SessionSummarySchema = z.object({
	id: z.string(),
	projectId: z.string(),
	status: z.enum(['active', 'ended']),
	createdAt: z.string(),
	endedAt: z.string().nullable(),
	eventCount: z.number().int().nonnegative(),
	lastEventAt: z.string().nullable(),
})

export const ListSessionsParamsSchema = z.object({
	projectId: z.string().min(1),
})

export const ListSessionsResponseSchema = z.object({
	sessions: z.array(SessionSummarySchema),
})

export const listSessionsEndpoint = {
	method: 'GET' as const,
	path: '/api/projects/:projectId/sessions',
	params: ListSessionsParamsSchema,
	response: ListSessionsResponseSchema,
} satisfies EndpointSchema

export const CreateSessionRequestSchema = z.object({
	projectId: z.string().min(1),
})

export const CreateSessionResponseSchema = z.object({
	session: SessionSchema,
})

export const createSessionEndpoint = {
	method: 'POST' as const,
	path: '/api/projects/:projectId/sessions',
	params: CreateSessionRequestSchema,
	response: CreateSessionResponseSchema,
} satisfies EndpointSchema

export const DeleteSessionParamsSchema = z.object({
	projectId: z.string().min(1),
	sessionId: z.string().min(1),
})

export const DeleteSessionResponseSchema = z.object({
	ok: z.literal(true),
})

export const deleteSessionEndpoint = {
	method: 'DELETE' as const,
	path: '/api/projects/:projectId/sessions/:sessionId',
	params: DeleteSessionParamsSchema,
	response: DeleteSessionResponseSchema,
} satisfies EndpointSchema

export const StopSessionParamsSchema = z.object({
	projectId: z.string().min(1),
	sessionId: z.string().min(1),
})

export const StopSessionResponseSchema = z.object({
	ok: z.literal(true),
})

export const stopSessionEndpoint = {
	method: 'POST' as const,
	path: '/api/projects/:projectId/sessions/:sessionId/stop',
	params: StopSessionParamsSchema,
	response: StopSessionResponseSchema,
} satisfies EndpointSchema

export type Session = z.infer<typeof SessionSchema>
export type SessionSummary = z.infer<typeof SessionSummarySchema>
