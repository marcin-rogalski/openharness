import { z } from 'zod'

export const DeleteProjectInputSchema = z.object({
	projectId: z.string().min(1),
})

export type DeleteProjectInput = z.infer<typeof DeleteProjectInputSchema>

export interface DeleteProjectOutput {
	ok: true
}

export interface DeleteProjectUseCasePort {
	handle(input: DeleteProjectInput): Promise<DeleteProjectOutput>
}
