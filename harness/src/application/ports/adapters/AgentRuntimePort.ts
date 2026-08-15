import type { AgentTimelineEntry } from '@/domain/AgentTimelineEntry'

export interface AgentRuntimeRequest {
	projectId: string
	content: string
}

export interface AgentRuntimePort {
	handle(request: AgentRuntimeRequest): Promise<AgentTimelineEntry[]>
}
