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

export type Session = z.infer<typeof SessionSchema>
export type SessionSummary = z.infer<typeof SessionSummarySchema>
