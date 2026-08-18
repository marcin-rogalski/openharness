import type { Permission } from '@/domain/Permission'

export interface PermissionRepositoryPort {
	list(): Promise<Permission[]>
	get(id: string): Promise<Permission | null>
	create(permission: Permission): Promise<Permission>
	update(id: string, permission: Permission): Promise<Permission>
}
