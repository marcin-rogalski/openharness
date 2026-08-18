import type { ApprovalPort } from '@/application/ports/adapters/ApprovalPort'
import type { EventLogPort } from '@/application/ports/adapters/EventLogPort'
import type { PolicyPort } from '@/application/ports/adapters/PolicyPort'
import type { SandboxPort } from '@/application/ports/adapters/SandboxPort'
import type { ToolExecutorPort } from '@/application/ports/adapters/ToolExecutorPort'
import type { ToolRegistryPort } from '@/application/ports/adapters/ToolRegistryPort'
import type { SessionEvent } from '@/domain/SessionEvent'
import type { ToolCall } from '@/domain/ToolCall'
import { ToolNotFoundError } from '@/domain/ToolNotFoundError'
import type { ToolResult } from '@/domain/ToolResult'

const PATH_KEYS = ['path', 'file', 'filePath', 'target'] as const

function extractPath(input: Record<string, unknown>): string | undefined {
	for (const key of PATH_KEYS) {
		const value = input[key]
		if (typeof value === 'string' && value.length > 0) {
			return value
		}
	}
	return undefined
}

export interface ToolExecutionContext {
	projectId: string
	turnId: string
	stepId: string
}

export default class ToolExecutionService {
	constructor(
		private readonly registry: ToolRegistryPort,
		private readonly executor: ToolExecutorPort,
		private readonly policy: PolicyPort,
		private readonly approval: ApprovalPort,
		private readonly sandbox: SandboxPort,
		private readonly eventLog: EventLogPort,
	) {}

	async execute(
		call: ToolCall,
		context: ToolExecutionContext,
	): Promise<ToolResult> {
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
			await this.appendEvent(call, context, 'approval_requested', {
				toolCallId: call.id,
				toolId: call.toolId,
				input: call.input,
			})
			const approvalDecision = await this.approval.requestApproval(call)
			await this.appendEvent(call, context, 'approval_decided', {
				toolCallId: call.id,
				decision: approvalDecision,
			})
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

		if (tool.sandboxLevel !== 'none') {
			const accessPath = extractPath(call.input)
			const sandboxDecision = await this.sandbox.checkAccess(
				tool.sandboxLevel,
				accessPath,
			)
			if (!sandboxDecision.allowed) {
				return this.freeze({
					toolCallId: call.id,
					status: 'error',
					output: null,
					error: `Sandbox denied: ${sandboxDecision.reason}`,
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

	private async appendEvent(
		call: ToolCall,
		context: ToolExecutionContext,
		type: SessionEvent['type'],
		payload: Record<string, unknown>,
	): Promise<void> {
		const event: SessionEvent = {
			id: crypto.randomUUID(),
			sessionId: call.sessionId,
			projectId: context.projectId,
			turnId: context.turnId,
			stepId: context.stepId,
			timestamp: new Date().toISOString(),
			actor: 'agent',
			type,
			payload,
			visibility: 'both',
		}
		await this.eventLog.append(event)
	}

	private freeze(result: ToolResult): ToolResult {
		return Object.freeze(result)
	}
}
