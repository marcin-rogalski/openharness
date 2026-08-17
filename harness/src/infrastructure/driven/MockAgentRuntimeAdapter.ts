import type {
	AgentRuntimePort,
	AgentRuntimeRequest,
	AgentRuntimeResponse,
} from '@/application/ports/adapters/AgentRuntimePort'

export interface MockScenario {
	toolCalls?: { id: string; tool: string; input: string }[]
	response: string
	finishReason?: 'stop' | 'tool_calls'
}

export default class MockAgentRuntimeAdapter implements AgentRuntimePort {
	private callIndex = 0
	private scenarios: MockScenario[]

	constructor(scenarios?: MockScenario[]) {
		this.scenarios = scenarios ?? []
	}

	async handle(request: AgentRuntimeRequest): Promise<AgentRuntimeResponse> {
		const callIndex = this.callIndex
		this.callIndex++

		const lastMessage = request.context[request.context.length - 1]
		const content = lastMessage?.role === 'user' ? lastMessage.content : ''

		if (callIndex < this.scenarios.length) {
			const scenario = this.scenarios[callIndex]
			return {
				thinking: null,
				toolCalls: scenario.toolCalls ?? [],
				response: scenario.response,
				finishReason: scenario.finishReason ?? 'stop',
				usage: { inputTokens: 10, outputTokens: 20 },
			}
		}

		return {
			thinking: `Thinking about: ${content}`,
			toolCalls: [],
			response: `Mock response to: ${content}`,
			finishReason: 'stop',
			usage: { inputTokens: 10, outputTokens: 20 },
		}
	}

	get callCount(): number {
		return this.callIndex
	}

	reset(): void {
		this.callIndex = 0
	}
}
