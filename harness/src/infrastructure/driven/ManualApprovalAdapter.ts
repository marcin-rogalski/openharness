import type {
	ApprovalDecision,
	ApprovalPort,
} from '@/application/ports/adapters/ApprovalPort'
import type { ToolCall } from '@/domain/ToolCall'

export default class ManualApprovalAdapter implements ApprovalPort {
	private readonly decisions = new Map<string, ApprovalDecision>()

	async requestApproval(call: ToolCall): Promise<ApprovalDecision> {
		const decision = this.decisions.get(call.id)
		if (!decision) {
			return 'denied'
		}
		return decision
	}

	decide(toolCallId: string, decision: ApprovalDecision): void {
		this.decisions.set(toolCallId, decision)
	}
}
