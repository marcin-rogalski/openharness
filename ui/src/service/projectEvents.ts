import type { SessionEvent, TimelineEntry } from './schema'

export function projectEventsToTimeline(
	events: SessionEvent[],
): TimelineEntry[] {
	return events.flatMap((event): TimelineEntry[] => {
		switch (event.type) {
			case 'user_message':
				return [
					{
						type: 'user_message',
						id: event.id,
						projectId: event.projectId,
						content: event.payload.content as string,
					},
				]
			case 'model_output_received': {
				const entries: TimelineEntry[] = []
				const thinking = event.payload.thinking as string | null
				if (thinking) {
					entries.push({
						type: 'agent_thinking',
						id: `${event.id}-thinking`,
						projectId: event.projectId,
						text: thinking,
					})
				}
				const toolCalls =
					(event.payload.toolCalls as
						| { tool: string; input: string; output: string }[]
						| null) ?? []
				for (const toolCall of toolCalls) {
					entries.push({
						type: 'agent_tool_call',
						id: `${event.id}-tool-${toolCall.tool}-start`,
						projectId: event.projectId,
						tool: toolCall.tool,
						status: 'started',
						input: toolCall.input,
					})
					entries.push({
						type: 'agent_tool_call',
						id: `${event.id}-tool-${toolCall.tool}-done`,
						projectId: event.projectId,
						tool: toolCall.tool,
						status: 'completed',
						output: toolCall.output,
					})
				}
				entries.push({
					type: 'agent_response',
					id: `${event.id}-response`,
					projectId: event.projectId,
					text: event.payload.response as string,
				})
				return entries
			}
			default:
				return []
		}
	})
}
