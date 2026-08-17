import type { EndpointSchema } from '@openharness/fetch'
import { z } from 'zod'

export const ProviderModelInfoSchema = z.object({
	label: z.string().min(1),
})

export const ProviderConfigSchema = z.object({
	url: z.string().url(),
	models: z.record(z.string(), ProviderModelInfoSchema),
})

export const ConfigSchema = z.object({
	schemaVersion: z.literal(1),
	port: z.number().int().min(1).max(65535),
	projectsDir: z.string().min(1),
	providers: z.record(z.string(), ProviderConfigSchema).default({
		openai: {
			url: 'https://api.openai.com/v1',
			models: { 'gpt-4o-mini': { label: 'GPT-4o Mini' } },
		},
	}),
	defaultModel: z.string().min(1).default('openai/gpt-4o-mini'),
})

export const UpdateConfigBodySchema = z
	.object({
		port: z.number().int().min(1).max(65535).optional(),
		projectsDir: z.string().min(1).optional(),
		providers: z.record(z.string(), ProviderConfigSchema).optional(),
		defaultModel: z.string().min(1).optional(),
	})
	.refine(
		(value) =>
			value.port !== undefined ||
			value.projectsDir !== undefined ||
			value.providers !== undefined ||
			value.defaultModel !== undefined,
		{
			message: 'Provide at least one config field',
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
