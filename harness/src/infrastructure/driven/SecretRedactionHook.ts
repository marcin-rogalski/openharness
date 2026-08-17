import type { HookPort } from '@/application/ports/adapters/HookPort'
import type { HookContext, HookResult } from '@/domain/Hook'

const SECRET_PATTERN =
	/(?:api[_-]?key|token|secret|password|authorization)\s*[:=]\s*[\w./-]+/gi

export default class SecretRedactionHook implements HookPort {
	readonly id = 'secret-redaction'
	readonly priority = 5

	async invoke(_context: HookContext, payload: unknown): Promise<HookResult> {
		const text = JSON.stringify(payload)
		const matches = text.match(SECRET_PATTERN)

		if (!matches || matches.length === 0) {
			return { decision: 'allow', annotations: [], reason: null }
		}

		return {
			decision: 'annotate',
			annotations: [
				{
					hookId: this.id,
					key: 'redacted_secrets',
					value: matches.length,
				},
			],
			reason: null,
		}
	}
}
