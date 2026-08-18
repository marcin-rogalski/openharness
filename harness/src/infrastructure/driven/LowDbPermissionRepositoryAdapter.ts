import type { PermissionRepositoryPort } from '@/application/ports/adapters/PermissionRepositoryPort'
import type { Permission } from '@/domain/Permission'
import type LowDbStore from './LowDbStore'

export default class LowDbPermissionRepositoryAdapter
	implements PermissionRepositoryPort
{
	constructor(private readonly store: LowDbStore) {}

	async list(): Promise<Permission[]> {
		return [...this.store.db.data.permissions]
	}

	async get(id: string): Promise<Permission | null> {
		return this.store.db.data.permissions.find((p) => p.id === id) ?? null
	}

	async create(permission: Permission): Promise<Permission> {
		this.store.db.data.permissions.push(permission)
		await this.store.persist()
		return permission
	}

	async update(id: string, permission: Permission): Promise<Permission> {
		const index = this.store.db.data.permissions.findIndex((p) => p.id === id)
		if (index === -1) {
			throw new Error(`Permission not found: ${id}`)
		}
		this.store.db.data.permissions[index] = permission
		await this.store.persist()
		return permission
	}
}
