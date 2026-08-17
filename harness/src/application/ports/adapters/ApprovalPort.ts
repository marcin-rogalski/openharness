import type { ToolCall } from '@/domain/ToolCall'

export type ApprovalDecision = 'approved' | 'denied'

export interface ApprovalPort {
	requestApproval(call: ToolCall): Promise<ApprovalDecision>
	decide(toolCallId: string, decision: ApprovalDecision): void
}
