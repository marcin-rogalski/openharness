import type {
	AgentRuntimePort,
	AgentRuntimeRequest,
	AgentRuntimeResponse,
} from '@/application/ports/adapters/AgentRuntimePort'

interface OpenAiMessage {
	role: 'system' | 'user' | 'assistant'
	content: string
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
}

interface OpenAiResponse {
	choices: OpenAiChoice[]
}

export default class OpenAiAgentRuntimeAdapter implements AgentRuntimePort {
	constructor(
		private readonly apiKey: string,
		private readonly model: string,
		private readonly baseUrl: string = 'https://api.openai.com/v1',
	) {}

	async handle(request: AgentRuntimeRequest): Promise<AgentRuntimeResponse> {
		const messages: OpenAiMessage[] = request.context.map((msg) => ({
			role: msg.role,
			content: msg.content,
		}))

		const response = await fetch(`${this.baseUrl}/chat/completions`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ model: this.model, messages }),
		})

		if (!response.ok) {
			const body = await response.text()
			throw new Error(`OpenAI API error ${response.status}: ${body}`)
		}

		const data = (await response.json()) as OpenAiResponse
		const choice = data.choices[0]

		if (!choice) {
			throw new Error('OpenAI API returned no choices')
		}

		const toolCalls = (choice.message.tool_calls ?? []).map((tc) => ({
			tool: tc.function.name,
			input: tc.function.arguments,
			output: '',
		}))

		return {
			thinking: null,
			toolCalls,
			response: choice.message.content ?? '',
		}
	}
}
