import type { TimelineEntry } from './schema'

export function createMockTimelineEntries(
	projectId: string,
	content: string,
): TimelineEntry[] {
	return [
		{
			type: 'agent_thinking',
			id: crypto.randomUUID(),
			projectId,
			text: `Thinking about: ${content}`,
		},
		{
			type: 'agent_tool_call',
			id: crypto.randomUUID(),
			projectId,
			tool: 'mock_tool',
			status: 'started',
			input: content,
		},
		{
			type: 'agent_tool_call',
			id: crypto.randomUUID(),
			projectId,
			tool: 'mock_tool',
			status: 'completed',
			output: 'ok',
		},
		{
			type: 'agent_response',
			id: crypto.randomUUID(),
			projectId,
			text: `Mock response to: ${content}`,
		},
	]
}
