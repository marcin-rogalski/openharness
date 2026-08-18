import type { SessionEvent, TimelineEntry } from './schema'

export function stringifyEventValue(value: unknown): string | undefined {
	if (value === null || value === undefined) {
		return undefined
	}
	if (typeof value === 'string') {
		return value
	}
	try {
		return JSON.stringify(value)
	} catch {
		return String(value)
	}
}

export function projectEventsToTimeline(
	events: SessionEvent[],
): TimelineEntry[] {
	return events.flatMap((event): TimelineEntry[] => {
		switch (event.type) {
			case 'user_message': {
				const content = event.payload.content
				if (typeof content !== 'string') {
					return []
				}
				return [
					{
						type: 'user_message',
						id: event.id,
						projectId: event.projectId,
						content,
					},
				]
			}
			case 'model_output_received': {
				const entries: TimelineEntry[] = []
				const thinking = event.payload.thinking
				if (typeof thinking === 'string' && thinking.length > 0) {
					entries.push({
						type: 'agent_thinking',
						id: `${event.id}-thinking`,
						projectId: event.projectId,
						text: thinking,
					})
				}
				const response = event.payload.response
				if (typeof response === 'string' && response.length > 0) {
					entries.push({
						type: 'agent_response',
						id: `${event.id}-response`,
						projectId: event.projectId,
						text: response,
					})
				}
				return entries
			}
			case 'tool_call_requested': {
				const toolCallId = event.payload.toolCallId
				const toolId = event.payload.toolId
				if (typeof toolCallId !== 'string' || typeof toolId !== 'string') {
					return []
				}
				return [
					{
						type: 'agent_tool_call',
						id: `tool-${toolCallId}-started`,
						projectId: event.projectId,
						tool: toolId,
						status: 'started',
						input: stringifyEventValue(event.payload.input),
					},
				]
			}
			case 'tool_result_produced': {
				const toolCallId = event.payload.toolCallId
				if (typeof toolCallId !== 'string') {
					return []
				}
				const error = event.payload.error
				const output =
					error === null || error === undefined
						? stringifyEventValue(event.payload.output)
						: stringifyEventValue(error)
				const tool =
					typeof event.payload.toolId === 'string'
						? event.payload.toolId
						: 'unknown'
				return [
					{
						type: 'agent_tool_call',
						id: `tool-${toolCallId}-completed`,
						projectId: event.projectId,
						tool,
						status: 'completed',
						output,
					},
				]
			}
			default:
				return []
		}
	})
}
