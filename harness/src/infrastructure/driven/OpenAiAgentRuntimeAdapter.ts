import type {
	AgentRuntimePort,
	AgentRuntimeRequest,
	AgentRuntimeResponse,
	AgentRuntimeToolCall,
	ModelContextMessage,
} from '@/application/ports/adapters/AgentRuntimePort'
import type { FinishReason } from '@/domain/FinishReason'
import type { ToolDefinition } from '@/domain/ToolDefinition'

interface OpenAiMessage {
	role: 'system' | 'user' | 'assistant' | 'tool'
	content: string | null
	tool_calls?: { id: string; type: 'function'; function: { name: string; arguments: string } }[]
	tool_call_id?: string
}

interface OpenAiTool {
	type: 'function'
	function: {
		name: string
		description: string
		parameters: Record<string, unknown>
	}
}

interface OpenAiToolCall {
	id: string
	function: {
		name: string
		arguments: string
	}
}

interface OpenAiChoice {
	message: {
		role: string
		content: string | null
		tool_calls?: OpenAiToolCall[]
	}
	finish_reason: string | null
}

interface OpenAiResponse {
	choices: OpenAiChoice[]
	usage?: {
		prompt_tokens: number
		completion_tokens: number
	}
}

function mapContextMessage(msg: ModelContextMessage): OpenAiMessage {
	switch (msg.role) {
		case 'tool':
			return {
				role: 'tool',
				tool_call_id: msg.toolCallId,
				content: msg.content,
			}
		case 'assistant': {
			const result: OpenAiMessage = {
				role: 'assistant',
				content: msg.content || null,
			}
			if (msg.toolCalls && msg.toolCalls.length > 0) {
				result.tool_calls = msg.toolCalls.map((tc) => ({
					id: tc.id,
					type: 'function' as const,
					function: { name: tc.tool, arguments: tc.input },
				}))
			}
			return result
		}
		default:
			return { role: msg.role, content: msg.content }
	}
}

function mapTools(tools: ToolDefinition[]): OpenAiTool[] {
	return tools.map((tool) => ({
		type: 'function' as const,
		function: {
			name: tool.name,
			description: tool.description,
			parameters: tool.inputSchema,
		},
	}))
}

function mapFinishReason(reason: string | null): FinishReason {
	switch (reason) {
		case 'tool_calls':
			return 'tool_calls'
		case 'length':
			return 'max_tokens'
		case 'content_filter':
			return 'content_filter'
		case 'stop':
		default:
			return 'stop'
	}
}

export default class OpenAiAgentRuntimeAdapter implements AgentRuntimePort {
	constructor(
		private readonly apiKey: string,
		private readonly model: string,
		private readonly baseUrl: string = 'https://api.openai.com/v1',
	) {}

	async handle(request: AgentRuntimeRequest): Promise<AgentRuntimeResponse> {
		const messages: OpenAiMessage[] = request.context.map(mapContextMessage)

		const body: Record<string, unknown> = { model: this.model, messages }

		if (request.tools.length > 0) {
			body.tools = mapTools(request.tools)
		}

		const response = await fetch(`${this.baseUrl}/chat/completions`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
		})

		if (!response.ok) {
			const text = await response.text()
			throw new Error(`OpenAI API error ${response.status}: ${text}`)
		}

		const data = (await response.json()) as OpenAiResponse
		const choice = data.choices[0]

		if (!choice) {
			throw new Error('OpenAI API returned no choices')
		}

		const toolCalls: AgentRuntimeToolCall[] = (choice.message.tool_calls ?? []).map(
			(tc) => ({
				id: tc.id,
				tool: tc.function.name,
				input: tc.function.arguments,
			}),
		)

		return {
			thinking: null,
			toolCalls,
			response: choice.message.content ?? '',
			finishReason: mapFinishReason(choice.finish_reason),
			usage: {
				inputTokens: data.usage?.prompt_tokens ?? 0,
				outputTokens: data.usage?.completion_tokens ?? 0,
			},
		}
	}
}
