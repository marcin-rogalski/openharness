import { z } from 'zod'
import type { Session } from '@/domain/Session'

export const CreateSessionInputSchema = z.object({
	projectId: z.string().min(1),
})

export type CreateSessionInput = z.infer<typeof CreateSessionInputSchema>

export interface CreateSessionOutput {
	session: Session
}

export interface CreateSessionUseCasePort {
	handle(input: CreateSessionInput): Promise<CreateSessionOutput>
}
