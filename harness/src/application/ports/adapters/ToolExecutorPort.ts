import type { ToolResult } from '@/domain/ToolResult'

export interface ToolExecutorPort {
	execute(toolId: string, input: Record<string, unknown>): Promise<ToolResult>
}
