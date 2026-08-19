import { z } from 'zod'
import type { Project } from '@/domain/Project'

export const CreateProjectInputSchema = z.object({
	name: z.string().min(1),
})

export type CreateProjectInput = z.infer<typeof CreateProjectInputSchema>

export interface CreateProjectOutput {
	project: Project
}

export interface CreateProjectUseCasePort {
	handle(input: CreateProjectInput): Promise<CreateProjectOutput>
}
