import type { ToolDefinition } from '@/domain/ToolDefinition'

export interface ToolRegistryPort {
	listTools(): Promise<ToolDefinition[]>
	getTool(toolId: string): Promise<ToolDefinition | null>
}
