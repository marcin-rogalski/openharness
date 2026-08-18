import type { Permission } from '@/domain/Permission'

export interface ListPermissionsOutput {
	permissions: Permission[]
}

export interface CreatePermissionInput {
	permission: Permission
}

export interface CreatePermissionOutput {
	permission: Permission
}

export interface UpdatePermissionInput {
	id: string
	permission: Permission
}

export interface UpdatePermissionOutput {
	permission: Permission
}

export interface PermissionUsecasePort {
	list(): Promise<ListPermissionsOutput>
	create(input: CreatePermissionInput): Promise<CreatePermissionOutput>
	update(input: UpdatePermissionInput): Promise<UpdatePermissionOutput>
}
