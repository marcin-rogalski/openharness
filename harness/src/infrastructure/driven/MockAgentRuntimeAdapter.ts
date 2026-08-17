import type {
	AgentRuntimePort,
	AgentRuntimeRequest,
	AgentRuntimeResponse,
} from '@/application/ports/adapters/AgentRuntimePort'

export default class MockAgentRuntimeAdapter implements AgentRuntimePort {
	async handle(request: AgentRuntimeRequest): Promise<AgentRuntimeResponse> {
		const lastMessage = request.context[request.context.length - 1]
		const content = lastMessage?.role === 'user' ? lastMessage.content : ''

		return {
			thinking: `Thinking about: ${content}`,
			toolCalls: [
				{
					tool: 'mock_tool',
					input: content,
					output: 'ok',
				},
			],
			response: `Mock response to: ${content}`,
		}
	}
}
