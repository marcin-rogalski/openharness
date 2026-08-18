import type { PermissionAction, PermissionResource, PermissionScope } from '@/domain/Permission'

export interface PermissionCheckResult {
	action: PermissionAction
	reason: string | null
}

export interface PermissionPort {
	check(
		resource: PermissionResource,
		resourceId: string,
		scope: PermissionScope,
		scopeId: string | null,
	): Promise<PermissionCheckResult>
}
