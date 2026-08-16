import type { EndpointSchema } from '@openharness/fetch'
import { z } from 'zod'

export const ProjectSchema = z.object({
	id: z.string(),
	name: z.string(),
	status: z.enum(['idle', 'running', 'failed']),
})

export const ListProjectsResponseSchema = z.object({
	projects: z.array(ProjectSchema),
})

export const listProjectsEndpoint = {
	method: 'GET' as const,
	path: '/api/projects',
	response: ListProjectsResponseSchema,
} satisfies EndpointSchema
