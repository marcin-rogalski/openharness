import type { EndpointSchema } from '@openharness/fetch'
import { z } from 'zod'

export const ConfigSchema = z.object({
	schemaVersion: z.literal(1),
	port: z.number().int().min(1).max(65535),
	projectsDir: z.string().min(1),
})

export const UpdateConfigBodySchema = z
	.object({
		port: z.number().int().min(1).max(65535).optional(),
		projectsDir: z.string().min(1).optional(),
	})
	.refine(
		(value) => value.port !== undefined || value.projectsDir !== undefined,
		{
			message: 'Provide port or projectsDir',
		},
	)

export const GetConfigResponseSchema = z.object({
	config: ConfigSchema,
})

export const UpdateConfigResponseSchema = z.object({
	config: ConfigSchema,
	restartRequired: z.boolean(),
})

export const getConfigEndpoint = {
	method: 'GET' as const,
	path: '/api/config',
	response: GetConfigResponseSchema,
} satisfies EndpointSchema

export const updateConfigEndpoint = {
	method: 'PUT' as const,
	path: '/api/config',
	body: UpdateConfigBodySchema,
	response: UpdateConfigResponseSchema,
} satisfies EndpointSchema
