import type { HookPort } from '@/application/ports/adapters/HookPort'
import type { HookAnnotation, HookContext, HookResult } from '@/domain/Hook'

export interface AggregatedHookResult {
	allowed: boolean
	annotations: HookAnnotation[]
	deniedBy: string | null
	reason: string | null
}

export default class HookRegistryService {
	private readonly hooks: HookPort[] = []

	register(hook: HookPort): void {
		this.hooks.push(hook)
		this.hooks.sort((a, b) => a.priority - b.priority)
	}

	async invoke(
		context: HookContext,
		payload: unknown,
	): Promise<AggregatedHookResult> {
		const annotations: HookAnnotation[] = []

		for (const hook of this.hooks) {
			const result: HookResult = await hook.invoke(context, payload)

			if (result.decision === 'deny') {
				return {
					allowed: false,
					annotations,
					deniedBy: hook.id,
					reason: result.reason,
				}
			}

			annotations.push(...result.annotations)
		}

		return {
			allowed: true,
			annotations,
			deniedBy: null,
			reason: null,
		}
	}

	get size(): number {
		return this.hooks.length
	}
}
