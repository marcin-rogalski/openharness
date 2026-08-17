import AgentLoopService from '@/application/services/AgentLoopService'
import HookRegistryService from '@/application/services/HookRegistryService'
import ToolExecutionService from '@/application/services/ToolExecutionService'
import SendProjectMessageUsecase from '@/application/usecases/SendProjectMessageUsecase'
import type { Project } from '@/domain/Project'
import type { SessionEvent } from '@/domain/SessionEvent'
import AllowAllPolicyAdapter from '@/infrastructure/driven/AllowAllPolicyAdapter'
import InMemoryEventLogAdapter from '@/infrastructure/driven/InMemoryEventLogAdapter'
import InMemoryProjectRepositoryAdapter from '@/infrastructure/driven/InMemoryProjectRepositoryAdapter'
import InMemorySessionRepositoryAdapter from '@/infrastructure/driven/InMemorySessionRepositoryAdapter'
import LocalToolProviderAdapter from '@/infrastructure/driven/LocalToolProviderAdapter'
import LogicalPathSandboxAdapter from '@/infrastructure/driven/LogicalPathSandboxAdapter'
import ManualApprovalAdapter from '@/infrastructure/driven/ManualApprovalAdapter'
import type { ReplayFixture } from './FixtureSchema'
import { normalizeEvents } from './Normalizer'
import ReplayAgentRuntimeAdapter from './ReplayAgentRuntimeAdapter'

export interface ReplayResult {
	sessionId: string
	events: SessionEvent[]
	normalizedEvents: SessionEvent[]
}

export interface ReplayDiff {
	matches: boolean
	missing: SessionEvent[]
	unexpected: SessionEvent[]
}

export default class ReplayRunner {
	private readonly usecase: SendProjectMessageUsecase
	private readonly eventLog: InMemoryEventLogAdapter
	private readonly agentRuntime: ReplayAgentRuntimeAdapter
	private _lastSessionId: string | null = null

	constructor(
		private readonly fixture: ReplayFixture,
		private readonly project: Project,
	) {
		this.eventLog = new InMemoryEventLogAdapter()
		this.agentRuntime = new ReplayAgentRuntimeAdapter(fixture)
		const projects = new InMemoryProjectRepositoryAdapter([project])
		const sessions = new InMemorySessionRepositoryAdapter()

		const toolProvider = new LocalToolProviderAdapter()
		const toolExecution = new ToolExecutionService(
			toolProvider,
			toolProvider,
			new AllowAllPolicyAdapter(),
			new ManualApprovalAdapter(),
			new LogicalPathSandboxAdapter({ level: 'workspace-write', workspaceRoot: '.' }),
		)
		const hooks = new HookRegistryService()

		const agentLoop = new AgentLoopService(
			this.agentRuntime,
			toolExecution,
			toolProvider,
			this.eventLog,
			hooks,
		)

		this.usecase = new SendProjectMessageUsecase(
			projects,
			sessions,
			this.eventLog,
			agentLoop,
		)
	}

	async send(content: string): Promise<ReplayResult> {
		const output = await this.usecase.handle({
			projectId: this.project.id,
			content,
		})
		this._lastSessionId = output.sessionId
		const events = await this.eventLog.listBySession(output.sessionId)
		return {
			sessionId: output.sessionId,
			events,
			normalizedEvents: normalizeEvents(events),
		}
	}

	async compare(expected: SessionEvent[]): Promise<ReplayDiff> {
		if (!this._lastSessionId) {
			return { matches: false, missing: expected, unexpected: [] }
		}
		const rawEvents = await this.eventLog.listBySession(this._lastSessionId)
		const actual = normalizeEvents(rawEvents)
		const normalizedExpected = normalizeEvents(expected)
		return diffEvents(actual, normalizedExpected)
	}

	get lastSessionId(): string | null {
		return this._lastSessionId
	}

	get runtime(): ReplayAgentRuntimeAdapter {
		return this.agentRuntime
	}
}

export function diffEvents(
	actual: SessionEvent[],
	expected: SessionEvent[],
): ReplayDiff {
	const actualKeys = actual.map(eventKey)
	const expectedKeys = expected.map(eventKey)

	const missing = expected.filter(
		(_, i) => !actualKeys.includes(expectedKeys[i]),
	)
	const unexpected = actual.filter(
		(_, i) => !expectedKeys.includes(actualKeys[i]),
	)

	return {
		matches: missing.length === 0 && unexpected.length === 0,
		missing,
		unexpected,
	}
}

function eventKey(event: SessionEvent): string {
	return `${event.type}:${JSON.stringify(event.payload)}`
}
