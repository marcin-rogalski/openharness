import type {
	PermissionCheckResult,
	PermissionPort,
} from '@/application/ports/adapters/PermissionPort'
import type { PermissionRepositoryPort } from '@/application/ports/adapters/PermissionRepositoryPort'
import type { PermissionResource, PermissionScope } from '@/domain/Permission'

const SCOPE_PRIORITY: Record<PermissionScope, number> = {
	session: 3,
	agent: 2,
	project: 1,
}

export default class LowDbPermissionAdapter implements PermissionPort {
	constructor(private readonly repository: PermissionRepositoryPort) {}

	async check(
		resource: PermissionResource,
		resourceId: string,
		scope: PermissionScope,
		scopeId: string | null,
	): Promise<PermissionCheckResult> {
		const all = await this.repository.list()
		const matches = all.filter(
			(p) => p.resource === resource && p.resourceId === resourceId,
		)

		if (matches.length === 0) {
			return { action: 'require_approval', reason: null }
		}

		const scoped = matches.filter((p) => {
			if (p.scope === scope && p.scopeId === scopeId) return true
			if (p.scope === 'project' && p.scopeId === null) return true
			return false
		})

		const candidates = scoped.length > 0 ? scoped : matches

		const best = candidates.reduce((a, b) =>
			SCOPE_PRIORITY[b.scope] > SCOPE_PRIORITY[a.scope] ? b : a,
		)

		return { action: best.action, reason: null }
	}
}
