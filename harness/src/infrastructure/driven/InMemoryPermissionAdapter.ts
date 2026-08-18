import type { PermissionPort, PermissionCheckResult } from '@/application/ports/adapters/PermissionPort'
import type { Permission, PermissionResource, PermissionScope } from '@/domain/Permission'

const SCOPE_PRIORITY: Record<PermissionScope, number> = {
	session: 3,
	agent: 2,
	project: 1,
}

export default class InMemoryPermissionAdapter implements PermissionPort {
	private readonly permissions: Permission[]

	constructor(permissions: Permission[]) {
		this.permissions = permissions
	}

	async check(
		resource: PermissionResource,
		resourceId: string,
		scope: PermissionScope,
		scopeId: string | null,
	): Promise<PermissionCheckResult> {
		const matches = this.permissions.filter(
			(p) => p.resource === resource && p.resourceId === resourceId,
		)

		if (matches.length === 0) {
			return { action: 'allow', reason: null }
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
