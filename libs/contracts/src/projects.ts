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

export const CreateProjectRequestSchema = z.object({
	name: z.string().min(1),
})

export const CreateProjectResponseSchema = z.object({
	project: ProjectSchema,
})

export const createProjectEndpoint = {
	method: 'POST' as const,
	path: '/api/projects',
	body: CreateProjectRequestSchema,
	response: CreateProjectResponseSchema,
} satisfies EndpointSchema
