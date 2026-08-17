import type { ModelContextMessage } from '@/application/ports/adapters/AgentRuntimePort'
import type { SessionEvent } from '@/domain/SessionEvent'

export default class SessionContextService {
	deriveContext(events: SessionEvent[]): ModelContextMessage[] {
		return events
			.filter(
				(event) => event.visibility === 'model' || event.visibility === 'both',
			)
			.flatMap((event): ModelContextMessage[] => {
				switch (event.type) {
					case 'user_message':
						return [
							{
								role: 'user',
								content: event.payload.content as string,
							},
						]
					case 'model_output_received': {
						const toolCalls = event.payload.toolCalls as
							| { id: string; tool: string; input: string }[]
							| undefined
						const msg: ModelContextMessage = {
							role: 'assistant',
							content: (event.payload.response as string) ?? '',
						}
						if (toolCalls && toolCalls.length > 0) {
							;(msg as { toolCalls?: unknown }).toolCalls = toolCalls
						}
						return [msg]
					}
					case 'tool_result_produced':
						return [
							{
								role: 'tool',
								toolCallId: event.payload.toolCallId as string,
								content:
									event.payload.error != null
										? `Error: ${event.payload.error}`
										: JSON.stringify(event.payload.output ?? ''),
							},
						]
					default:
						return []
				}
			})
	}
}
