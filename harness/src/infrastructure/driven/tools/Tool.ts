import type { ToolDefinition } from '@/domain/ToolDefinition'
import type { ToolResult } from '@/domain/ToolResult'

export interface Tool {
	definition: ToolDefinition
	execute(input: Record<string, unknown>): Promise<ToolResult>
}
