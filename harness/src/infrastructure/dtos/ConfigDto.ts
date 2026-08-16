import { z } from 'zod'

export const ConfigDto = z.object({
	schemaVersion: z.literal(1),
	port: z.number().int().min(1).max(65535),
	projectsDir: z.string().min(1),
})

export type ConfigDto = z.infer<typeof ConfigDto>

export const UpdateConfigBodyDto = z
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

export type UpdateConfigBodyDto = z.infer<typeof UpdateConfigBodyDto>

export const GetConfigResponseDto = z.object({
	config: ConfigDto,
})

export const UpdateConfigResponseDto = z.object({
	config: ConfigDto,
	restartRequired: z.boolean(),
})

export const HealthDto = z.object({
	status: z.literal('ok'),
})
