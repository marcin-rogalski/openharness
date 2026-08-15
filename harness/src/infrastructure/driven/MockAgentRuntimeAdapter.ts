import type { AgentRuntimePort } from '@/application/ports/adapters/AgentRuntimePort'
import type { AgentTimelineEntry } from '@/domain/AgentTimelineEntry'

export default class MockAgentRuntimeAdapter implements AgentRuntimePort {
	async handle(request: {
		projectId: string
		content: string
	}): Promise<AgentTimelineEntry[]> {
		return [
			{
				type: 'agent_thinking',
				id: crypto.randomUUID(),
				projectId: request.projectId,
				text: `Thinking about: ${request.content}`,
			},
			{
				type: 'agent_tool_call',
				id: crypto.randomUUID(),
				projectId: request.projectId,
				tool: 'mock_tool',
				status: 'started',
				input: request.content,
			},
			{
				type: 'agent_tool_call',
				id: crypto.randomUUID(),
				projectId: request.projectId,
				tool: 'mock_tool',
				status: 'completed',
				output: 'ok',
			},
			{
				type: 'agent_response',
				id: crypto.randomUUID(),
				projectId: request.projectId,
				text: `Mock response to: ${request.content}`,
			},
		]
	}
}
