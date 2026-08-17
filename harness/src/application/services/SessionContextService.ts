import type { ModelContextMessage } from '@/application/ports/adapters/AgentRuntimePort'
import type { SessionEvent } from '@/domain/SessionEvent'

export default class SessionContextService {
	deriveContext(events: SessionEvent[]): ModelContextMessage[] {
		return events
			.filter(
				(event) =>
					event.visibility === 'model' || event.visibility === 'both',
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
					case 'model_output_received':
						return [
							{
								role: 'assistant',
								content: event.payload.response as string,
							},
						]
					default:
						return []
				}
			})
	}
}
