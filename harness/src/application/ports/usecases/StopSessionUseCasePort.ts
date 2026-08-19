import { z } from 'zod'

export const StopSessionInputSchema = z.object({
	projectId: z.string().min(1),
	sessionId: z.string().min(1),
})

export type StopSessionInput = z.infer<typeof StopSessionInputSchema>

export interface StopSessionOutput {
	ok: true
}

export interface StopSessionUseCasePort {
	handle(input: StopSessionInput): Promise<StopSessionOutput>
}
