import type {
	AgentRuntimePort,
	AgentRuntimeRequest,
	AgentRuntimeResponse,
} from '@/application/ports/adapters/AgentRuntimePort'
import type { ReplayFixture } from './FixtureSchema'

export class FixtureUnderrunError extends Error {
	constructor(turnIndex: number, totalTurns: number) {
		super(
			`Fixture underrun: requested turn ${turnIndex} but fixture only has ${totalTurns} turn(s)`,
		)
		this.name = 'FixtureUnderrunError'
	}
}

export default class ReplayAgentRuntimeAdapter implements AgentRuntimePort {
	private turnIndex = 0

	constructor(private readonly fixture: ReplayFixture) {}

	async handle(_request: AgentRuntimeRequest): Promise<AgentRuntimeResponse> {
		if (this.turnIndex >= this.fixture.turns.length) {
			throw new FixtureUnderrunError(this.turnIndex, this.fixture.turns.length)
		}

		const turn = this.fixture.turns[this.turnIndex]
		this.turnIndex++

		return {
			thinking: turn.thinking,
			toolCalls: turn.toolCalls.map((tc) => ({
				tool: tc.tool,
				input: tc.input,
				output: tc.output,
			})),
			response: turn.response,
		}
	}

	get consumedTurns(): number {
		return this.turnIndex
	}

	get totalTurns(): number {
		return this.fixture.turns.length
	}

	get isExhausted(): boolean {
		return this.turnIndex >= this.fixture.turns.length
	}

	reset(): void {
		this.turnIndex = 0
	}
}
