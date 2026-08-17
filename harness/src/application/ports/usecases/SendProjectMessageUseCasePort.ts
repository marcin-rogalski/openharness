import { z } from 'zod'
import type { SessionEvent } from '@/domain/SessionEvent'

export const SendProjectMessageInputSchema = z.object({
	projectId: z.string().min(1),
	content: z.string().refine((value) => value.trim().length > 0, {
		message: 'content must not be empty',
	}),
})

export type SendProjectMessageInput = z.infer<
	typeof SendProjectMessageInputSchema
>

export interface SendProjectMessageOutput {
	sessionId: string
	events: SessionEvent[]
}

export interface SendProjectMessageUseCasePort {
	handle(input: SendProjectMessageInput): Promise<SendProjectMessageOutput>
}
