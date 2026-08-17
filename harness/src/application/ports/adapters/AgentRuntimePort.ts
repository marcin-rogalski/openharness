import type { FinishReason } from '@/domain/FinishReason'
import type { TokenUsage } from '@/domain/TokenUsage'
import type { ToolDefinition } from '@/domain/ToolDefinition'

export type ModelContextMessage =
	| { role: 'user'; content: string }
	| { role: 'assistant'; content: string; toolCalls?: AgentRuntimeToolCall[] }
	| { role: 'system'; content: string }
	| { role: 'tool'; toolCallId: string; content: string }

export interface AgentRuntimeToolCall {
	id: string
	tool: string
	input: string
}

export interface AgentRuntimeRequest {
	sessionId: string
	projectId: string
	turnId: string
	step: number
	context: ModelContextMessage[]
	tools: ToolDefinition[]
}

export interface AgentRuntimeResponse {
	thinking: string | null
	toolCalls: AgentRuntimeToolCall[]
	response: string
	finishReason: FinishReason
	usage: TokenUsage
}

export interface AgentRuntimePort {
	handle(request: AgentRuntimeRequest): Promise<AgentRuntimeResponse>
}
