export type ModelContextMessage =
	| { role: 'user'; content: string }
	| { role: 'assistant'; content: string }
	| { role: 'system'; content: string }

export interface AgentRuntimeRequest {
	sessionId: string
	projectId: string
	context: ModelContextMessage[]
}

export interface AgentRuntimeToolCall {
	tool: string
	input: string
	output: string
}

export interface AgentRuntimeResponse {
	thinking: string | null
	toolCalls: AgentRuntimeToolCall[]
	response: string
}

export interface AgentRuntimePort {
	handle(request: AgentRuntimeRequest): Promise<AgentRuntimeResponse>
}
