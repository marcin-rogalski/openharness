import { z } from 'zod'

export const ApproveToolCallInputSchema = z.object({
	toolCallId: z.string().min(1),
})

export type ApproveToolCallInput = z.infer<typeof ApproveToolCallInputSchema>

export interface ApproveToolCallOutput {
	toolCallId: string
	approved: boolean
}

export interface ApproveToolCallUseCasePort {
	handle(input: ApproveToolCallInput): Promise<ApproveToolCallOutput>
}
