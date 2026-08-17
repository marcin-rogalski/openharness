import type {
	AgentRuntimePort,
	AgentRuntimeRequest,
	AgentRuntimeResponse,
} from '@/application/ports/adapters/AgentRuntimePort'
import type { FinishReason } from '@/domain/FinishReason'
import type { ReplayFixture } from './FixtureSchema'

export class FixtureUnderrunError extends Error {
	constructor(stepIndex: number, totalSteps: number) {
		super(
			`Fixture underrun: requested step ${stepIndex} but fixture only has ${totalSteps} step(s)`,
		)
		this.name = 'FixtureUnderrunError'
	}
}

export default class ReplayAgentRuntimeAdapter implements AgentRuntimePort {
	private stepIndex = 0

	constructor(private readonly fixture: ReplayFixture) {}

	async handle(_request: AgentRuntimeRequest): Promise<AgentRuntimeResponse> {
		if (this.stepIndex >= this.fixture.turns.length) {
			throw new FixtureUnderrunError(
				this.stepIndex,
				this.fixture.turns.length,
			)
		}

		const step = this.fixture.turns[this.stepIndex]
		this.stepIndex++

		const hasToolCalls = step.toolCalls.length > 0
		const finishReason: FinishReason = hasToolCalls ? 'tool_calls' : 'stop'

		return {
			thinking: step.thinking,
			toolCalls: step.toolCalls.map((tc) => ({
				id: tc.id ?? `replay-call-${this.stepIndex}-${tc.tool}`,
				tool: tc.tool,
				input: tc.input,
			})),
			response: step.response,
			finishReason,
			usage: { inputTokens: 100, outputTokens: 50 },
		}
	}

	get consumedSteps(): number {
		return this.stepIndex
	}

	get totalSteps(): number {
		return this.fixture.turns.length
	}

	get isExhausted(): boolean {
		return this.stepIndex >= this.fixture.turns.length
	}

	reset(): void {
		this.stepIndex = 0
	}
}
