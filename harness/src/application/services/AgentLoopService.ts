import type { AgentRuntimePort } from '@/application/ports/adapters/AgentRuntimePort'
import type { EventLogPort } from '@/application/ports/adapters/EventLogPort'
import type { ToolRegistryPort } from '@/application/ports/adapters/ToolRegistryPort'
import type { AgentLoopConfig } from '@/domain/AgentLoopConfig'
import type { SessionEvent } from '@/domain/SessionEvent'
import type { ToolCall } from '@/domain/ToolCall'
import type { ToolResult } from '@/domain/ToolResult'
import { executeBoundedParallel } from './BoundedParallelPool'
import SessionContextService from './SessionContextService'
import type ToolExecutionService from './ToolExecutionService'
import type HookRegistryService from './HookRegistryService'

export type AgentLoopStatus =
	| 'completed'
	| 'blocked'
	| 'error'
	| 'aborted'
	| 'max_steps'
	| 'max_tokens'

export interface AgentLoopResult {
	status: AgentLoopStatus
	steps: number
	reason: string | null
	error: string | null
}

export interface AgentLoopParams {
	sessionId: string
	projectId: string
	turnId: string
	config: AgentLoopConfig
	abortSignal?: AbortSignal
}

export default class AgentLoopService {
	private readonly contextService: SessionContextService

	constructor(
		private readonly agentRuntime: AgentRuntimePort,
		private readonly toolExecution: ToolExecutionService,
		private readonly toolRegistry: ToolRegistryPort,
		private readonly eventLog: EventLogPort,
		private readonly hooks: HookRegistryService,
	) {
		this.contextService = new SessionContextService()
	}

	async run(params: AgentLoopParams): Promise<AgentLoopResult> {
		const { sessionId, projectId, turnId, config, abortSignal } = params

		await this.appendEvent(sessionId, projectId, turnId, null, 'turn_started', {
			maxSteps: config.maxSteps,
		})

		for (let step = 0; step < config.maxSteps; step++) {
			if (abortSignal?.aborted) {
				await this.appendEvent(
					sessionId,
					projectId,
					turnId,
					null,
					'turn_ended',
					{ reason: 'aborted' },
				)
				return { status: 'aborted', steps: step, reason: 'aborted', error: null }
			}

			const stepId = crypto.randomUUID()

			const hookResult = await this.hooks.invoke(
				{
					sessionId,
					projectId,
					turnId,
					stepId,
					timestamp: new Date().toISOString(),
				},
				{ step, turnId },
			)

			if (!hookResult.allowed) {
				await this.appendEvent(
					sessionId,
					projectId,
					turnId,
					stepId,
					'turn_ended',
					{
						reason: 'blocked',
						deniedBy: hookResult.deniedBy,
						hookReason: hookResult.reason,
					},
				)
				return {
					status: 'blocked',
					steps: step,
					reason: hookResult.reason,
					error: null,
				}
			}

			await this.appendEvent(
				sessionId,
				projectId,
				turnId,
				stepId,
				'step_started',
				{ step },
			)

			const events = await this.eventLog.listBySession(sessionId)
			const context = this.contextService.deriveContext(events)
			const tools = await this.toolRegistry.listTools()

			let response
			try {
				response = await this.agentRuntime.handle({
					sessionId,
					projectId,
					turnId,
					step,
					context,
					tools,
				})
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error)
				await this.appendEvent(
					sessionId,
					projectId,
					turnId,
					stepId,
					'error_occurred',
					{ error: message },
				)
				await this.appendEvent(
					sessionId,
					projectId,
					turnId,
					stepId,
					'turn_ended',
					{ reason: 'error' },
				)
				return { status: 'error', steps: step + 1, reason: null, error: message }
			}

			await this.appendEvent(
				sessionId,
				projectId,
				turnId,
				stepId,
				'model_output_received',
				{
					thinking: response.thinking,
					toolCalls: response.toolCalls,
					response: response.response,
					finishReason: response.finishReason,
					usage: response.usage,
				},
			)

			if (response.finishReason === 'max_tokens') {
				await this.appendEvent(
					sessionId,
					projectId,
					turnId,
					stepId,
					'turn_ended',
					{ reason: 'max_tokens' },
				)
				return { status: 'max_tokens', steps: step + 1, reason: null, error: null }
			}

			if (response.finishReason === 'stop' || response.toolCalls.length === 0) {
				await this.appendEvent(
					sessionId,
					projectId,
					turnId,
					stepId,
					'turn_ended',
					{ reason: 'completed' },
				)
				return { status: 'completed', steps: step + 1, reason: null, error: null }
			}

			const domainCalls: ToolCall[] = response.toolCalls.map((tc) => ({
				id: tc.id,
				sessionId,
				toolId: tc.tool,
				input: safeParseJson(tc.input),
				status: 'pending',
				createdAt: new Date().toISOString(),
			}))

			for (const call of domainCalls) {
				await this.appendEvent(
					sessionId,
					projectId,
					turnId,
					stepId,
					'tool_call_requested',
					{
						toolCallId: call.id,
						toolId: call.toolId,
						input: call.input,
					},
				)
			}

			const results = await executeBoundedParallel(
				domainCalls,
				config.maxParallelTools,
				async (call) => {
					try {
						return await this.toolExecution.execute(call)
					} catch (error) {
						const message =
							error instanceof Error ? error.message : String(error)
						return {
							toolCallId: call.id,
							status: 'error' as const,
							output: null,
							error: message,
							frozen: true,
						} satisfies ToolResult
					}
				},
				abortSignal,
			)

			for (let i = 0; i < domainCalls.length; i++) {
				const result = results[i] ?? {
					toolCallId: domainCalls[i].id,
					status: 'error' as const,
					output: null,
					error: 'Aborted before execution',
					frozen: true,
				}
				await this.appendEvent(
					sessionId,
					projectId,
					turnId,
					stepId,
					'tool_result_produced',
					{
						toolCallId: result.toolCallId,
						status: result.status,
						output: result.output,
						error: result.error,
					},
				)
			}
		}

		await this.appendEvent(sessionId, projectId, turnId, null, 'turn_ended', {
			reason: 'max_steps',
		})
		return {
			status: 'max_steps',
			steps: config.maxSteps,
			reason: null,
			error: null,
		}
	}

	private async appendEvent(
		sessionId: string,
		projectId: string,
		turnId: string | null,
		stepId: string | null,
		type: SessionEvent['type'],
		payload: Record<string, unknown>,
	): Promise<void> {
		const event: SessionEvent = {
			id: crypto.randomUUID(),
			sessionId,
			projectId,
			turnId,
			stepId,
			timestamp: new Date().toISOString(),
			actor: 'agent',
			type,
			payload,
			visibility: 'both',
		}
		await this.eventLog.append(event)
	}
}

function safeParseJson(value: string): Record<string, unknown> {
	try {
		const parsed = JSON.parse(value)
		if (typeof parsed === 'object' && parsed !== null) {
			return parsed as Record<string, unknown>
		}
		return { value: parsed }
	} catch {
		return { value }
	}
}
