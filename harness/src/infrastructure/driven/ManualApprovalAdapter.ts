import type {
	ApprovalDecision,
	ApprovalPort,
} from '@/application/ports/adapters/ApprovalPort'
import type { ToolCall } from '@/domain/ToolCall'

export default class ManualApprovalAdapter implements ApprovalPort {
	private readonly pending = new Map<
		string,
		(decision: ApprovalDecision) => void
	>()

	async requestApproval(call: ToolCall): Promise<ApprovalDecision> {
		return new Promise<ApprovalDecision>((resolve) => {
			this.pending.set(call.id, resolve)
		})
	}

	decide(toolCallId: string, decision: ApprovalDecision): void {
		const resolve = this.pending.get(toolCallId)
		if (resolve) {
			this.pending.delete(toolCallId)
			resolve(decision)
		}
	}
}
