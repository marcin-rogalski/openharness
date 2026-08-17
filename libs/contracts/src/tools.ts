import { z } from 'zod'

export const SandboxLevelSchema = z.enum([
	'none',
	'read-only',
	'workspace-write',
	'full',
])

export const ToolDefinitionSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string(),
	inputSchema: z.record(z.string(), z.unknown()),
	sandboxLevel: SandboxLevelSchema,
})

export const ToolCallStatusSchema = z.enum([
	'pending',
	'approved',
	'denied',
	'executing',
	'completed',
	'failed',
])

export const ToolCallSchema = z.object({
	id: z.string(),
	sessionId: z.string(),
	toolId: z.string(),
	input: z.record(z.string(), z.unknown()),
	status: ToolCallStatusSchema,
	createdAt: z.string(),
})

export const ToolResultSchema = z.object({
	toolCallId: z.string(),
	status: z.enum(['success', 'error']),
	output: z.unknown(),
	error: z.string().nullable(),
	frozen: z.boolean(),
})

export type SandboxLevel = z.infer<typeof SandboxLevelSchema>
export type ToolDefinition = z.infer<typeof ToolDefinitionSchema>
export type ToolCall = z.infer<typeof ToolCallSchema>
export type ToolResult = z.infer<typeof ToolResultSchema>
