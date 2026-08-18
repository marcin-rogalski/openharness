import type { ToolExecutorPort } from '@/application/ports/adapters/ToolExecutorPort'
import type { ToolRegistryPort } from '@/application/ports/adapters/ToolRegistryPort'
import type { ToolDefinition } from '@/domain/ToolDefinition'
import type { ToolResult } from '@/domain/ToolResult'
import ClockTool from './tools/ClockTool'
import type { Tool } from './tools/Tool'
import WebSearchTool from './tools/WebSearchTool'

export default class LocalToolProviderAdapter
	implements ToolRegistryPort, ToolExecutorPort
{
	private readonly tools: Map<string, Tool>

	constructor() {
		const instances: Tool[] = [new ClockTool(), new WebSearchTool()]
		this.tools = new Map(instances.map((t) => [t.definition.id, t]))
	}

	async listTools(): Promise<ToolDefinition[]> {
		return [...this.tools.values()].map((t) => t.definition)
	}

	async getTool(toolId: string): Promise<ToolDefinition | null> {
		return this.tools.get(toolId)?.definition ?? null
	}

	async execute(
		toolId: string,
		input: Record<string, unknown>,
	): Promise<ToolResult> {
		const tool = this.tools.get(toolId)
		if (!tool) {
			return {
				toolCallId: '',
				status: 'error',
				output: null,
				error: `Unknown tool: ${toolId}`,
				frozen: false,
			}
		}
		return tool.execute(input)
	}
}
