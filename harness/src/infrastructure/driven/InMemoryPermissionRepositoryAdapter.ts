import type { PermissionRepositoryPort } from '@/application/ports/adapters/PermissionRepositoryPort'
import type { Permission } from '@/domain/Permission'

export default class InMemoryPermissionRepositoryAdapter implements PermissionRepositoryPort {
	private readonly permissions = new Map<string, Permission>()

	async list(): Promise<Permission[]> {
		return [...this.permissions.values()]
	}

	async get(id: string): Promise<Permission | null> {
		return this.permissions.get(id) ?? null
	}

	async create(permission: Permission): Promise<Permission> {
		this.permissions.set(permission.id, permission)
		return permission
	}

	async update(id: string, permission: Permission): Promise<Permission> {
		if (!this.permissions.has(id)) {
			throw new Error(`Permission not found: ${id}`)
		}
		this.permissions.set(id, permission)
		return permission
	}
}
