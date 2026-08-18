import { describe, expect, it } from 'vitest'
import InMemoryPermissionRepositoryAdapter from './InMemoryPermissionRepositoryAdapter'
import type { Permission } from '@/domain/Permission'

const permission: Permission = {
	id: 'p1',
	name: 'Allow bash',
	resource: 'tool',
	resourceId: 'bash',
	action: 'allow',
	scope: 'project',
	scopeId: null,
}

describe('InMemoryPermissionRepositoryAdapter', () => {
	it('returns a stored permission', async () => {
		const repo = new InMemoryPermissionRepositoryAdapter()
		await repo.create(permission)

		await expect(repo.get('p1')).resolves.toEqual(permission)
	})

	it('returns null when the permission is missing', async () => {
		const repo = new InMemoryPermissionRepositoryAdapter()

		await expect(repo.get('missing')).resolves.toBeNull()
	})

	it('lists all stored permissions', async () => {
		const repo = new InMemoryPermissionRepositoryAdapter()
		await repo.create(permission)

		await expect(repo.list()).resolves.toEqual([permission])
	})

	it('creates a permission', async () => {
		const repo = new InMemoryPermissionRepositoryAdapter()

		await expect(repo.create(permission)).resolves.toEqual(permission)
	})

	it('updates an existing permission', async () => {
		const repo = new InMemoryPermissionRepositoryAdapter()
		await repo.create(permission)
		const updated = { ...permission, action: 'deny' as const }

		await expect(repo.update('p1', updated)).resolves.toEqual(updated)
	})

	it('throws when updating a missing permission', async () => {
		const repo = new InMemoryPermissionRepositoryAdapter()

		await expect(repo.update('missing', permission)).rejects.toThrow(
			'Permission not found: missing',
		)
	})
})
