import { z } from 'zod'
import type { HarnessConfig } from '@/domain/Config'

const ProviderConfigSchema = z.object({
	url: z.string().url(),
	models: z.record(z.string(), z.object({ label: z.string().min(1) })),
})

export const UpdateConfigInputSchema = z
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

export type UpdateConfigInput = z.infer<typeof UpdateConfigInputSchema>

export interface UpdateConfigOutput {
	config: HarnessConfig
	restartRequired: boolean
}

export interface UpdateConfigUseCasePort {
	handle(input: UpdateConfigInput): Promise<UpdateConfigOutput>
}
