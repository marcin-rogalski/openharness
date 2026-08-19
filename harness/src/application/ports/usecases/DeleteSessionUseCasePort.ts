import { z } from 'zod'

export const DeleteSessionInputSchema = z.object({
	projectId: z.string().min(1),
	sessionId: z.string().min(1),
})

export type DeleteSessionInput = z.infer<typeof DeleteSessionInputSchema>

export interface DeleteSessionOutput {
	ok: true
}

export interface DeleteSessionUseCasePort {
	handle(input: DeleteSessionInput): Promise<DeleteSessionOutput>
}
