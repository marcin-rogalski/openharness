import type { ApprovalPort } from '@/application/ports/adapters/ApprovalPort'
import type { PolicyPort } from '@/application/ports/adapters/PolicyPort'
import type { ToolExecutorPort } from '@/application/ports/adapters/ToolExecutorPort'
import type { ToolRegistryPort } from '@/application/ports/adapters/ToolRegistryPort'
import type { ToolCall } from '@/domain/ToolCall'
import { ToolNotFoundError } from '@/domain/ToolNotFoundError'
import type { ToolResult } from '@/domain/ToolResult'

export default class ToolExecutionService {
	constructor(
		private readonly registry: ToolRegistryPort,
		private readonly executor: ToolExecutorPort,
		private readonly policy: PolicyPort,
		private readonly approval: ApprovalPort,
	) {}

	async execute(call: ToolCall): Promise<ToolResult> {
		const tool = await this.registry.getTool(call.toolId)
		if (!tool) {
			throw new ToolNotFoundError(call.toolId)
		}

		const decision = await this.policy.evaluate(call)

		if (decision === 'deny') {
			return this.freeze({
				toolCallId: call.id,
				status: 'error',
				output: null,
				error: 'Tool call denied by policy',
				frozen: true,
			})
		}

		if (decision === 'require_approval') {
			const approvalDecision = await this.approval.requestApproval(call)
			if (approvalDecision === 'denied') {
				return this.freeze({
					toolCallId: call.id,
					status: 'error',
					output: null,
					error: 'Tool call denied by approval',
					frozen: true,
				})
			}
		}

		const result = await this.executor.execute(call.toolId, call.input)
		return this.freeze({
			toolCallId: call.id,
			status: result.status,
			output: result.output,
			error: result.error,
			frozen: true,
		})
	}

	private freeze(result: ToolResult): ToolResult {
		return Object.freeze(result)
	}
}
