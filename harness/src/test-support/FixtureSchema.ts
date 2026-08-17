import { z } from 'zod'

export const ReplayToolCallSchema = z.object({
	tool: z.string(),
	input: z.string(),
	output: z.string(),
})

export const ReplayTurnSchema = z.object({
	thinking: z.string().nullable(),
	toolCalls: z.array(ReplayToolCallSchema),
	response: z.string(),
})

export const ReplayFixtureSchema = z.object({
	name: z.string(),
	description: z.string().optional(),
	turns: z.array(ReplayTurnSchema).min(1),
})

export type ReplayToolCall = z.infer<typeof ReplayToolCallSchema>
export type ReplayTurn = z.infer<typeof ReplayTurnSchema>
export type ReplayFixture = z.infer<typeof ReplayFixtureSchema>
