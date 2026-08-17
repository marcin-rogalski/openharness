import { z } from 'zod'

export const DenyToolCallInputSchema = z.object({
	toolCallId: z.string().min(1),
})

export type DenyToolCallInput = z.infer<typeof DenyToolCallInputSchema>

export interface DenyToolCallOutput {
	toolCallId: string
	denied: boolean
}

export interface DenyToolCallUseCasePort {
	handle(input: DenyToolCallInput): Promise<DenyToolCallOutput>
}
