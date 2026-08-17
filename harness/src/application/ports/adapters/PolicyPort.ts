import type { ToolCall } from '@/domain/ToolCall'

export type PolicyDecision = 'allow' | 'deny' | 'require_approval'

export interface PolicyPort {
	evaluate(call: ToolCall): Promise<PolicyDecision>
}
