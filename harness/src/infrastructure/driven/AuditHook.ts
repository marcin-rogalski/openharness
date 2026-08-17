import type { HookPort } from '@/application/ports/adapters/HookPort'
import type { HookContext, HookResult } from '@/domain/Hook'

export interface AuditSink {
	record(entry: {
		hookId: string
		sessionId: string
		decision: string
		reason: string | null
		timestamp: string
	}): void
}

export default class AuditHook implements HookPort {
	readonly id = 'audit'
	readonly priority = 999

	constructor(private readonly sink: AuditSink) {}

	async invoke(context: HookContext, _payload: unknown): Promise<HookResult> {
		this.sink.record({
			hookId: this.id,
			sessionId: context.sessionId,
			decision: 'observe',
			reason: null,
			timestamp: context.timestamp,
		})
		return { decision: 'allow', annotations: [], reason: null }
	}
}
