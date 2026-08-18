export type PermissionResource = 'tool' | 'sandbox' | 'mcp_server'

export type PermissionAction = 'allow' | 'deny' | 'require_approval'

export type PermissionScope = 'project' | 'agent' | 'session'

export interface Permission {
	id: string
	name: string
	resource: PermissionResource
	resourceId: string
	action: PermissionAction
	scope: PermissionScope
	scopeId: string | null
}
