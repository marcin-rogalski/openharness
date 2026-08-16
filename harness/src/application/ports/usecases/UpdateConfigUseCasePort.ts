import type { HarnessConfig } from '@/domain/Config'
import { z } from 'zod'

export const UpdateConfigInputSchema = z
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

export type UpdateConfigInput = z.infer<typeof UpdateConfigInputSchema>

export interface UpdateConfigOutput {
	config: HarnessConfig
	restartRequired: boolean
}

export interface UpdateConfigUseCasePort {
	handle(input: UpdateConfigInput): Promise<UpdateConfigOutput>
}
