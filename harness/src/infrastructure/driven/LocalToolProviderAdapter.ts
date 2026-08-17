import type { ToolExecutorPort } from '@/application/ports/adapters/ToolExecutorPort'
import type { ToolRegistryPort } from '@/application/ports/adapters/ToolRegistryPort'
import type { ToolDefinition } from '@/domain/ToolDefinition'
import type { ToolResult } from '@/domain/ToolResult'

const mockTool: ToolDefinition = {
	id: 'mock_tool',
	name: 'Mock Tool',
	description: 'A read-only mock tool for development',
	inputSchema: { type: 'object' },
	sandboxLevel: 'none',
}

export default class LocalToolProviderAdapter
	implements ToolRegistryPort, ToolExecutorPort
{
	async listTools(): Promise<ToolDefinition[]> {
		return [mockTool]
	}

	async getTool(toolId: string): Promise<ToolDefinition | null> {
		return toolId === mockTool.id ? mockTool : null
	}

	async execute(
		toolId: string,
		input: Record<string, unknown>,
	): Promise<ToolResult> {
		if (toolId !== mockTool.id) {
			return {
				toolCallId: '',
				status: 'error',
				output: null,
				error: `Unknown tool: ${toolId}`,
				frozen: false,
			}
		}

		return {
			toolCallId: '',
			status: 'success',
			output: { echoed: input },
			error: null,
			frozen: false,
		}
	}
}
