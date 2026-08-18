import { describe, expect, it } from 'vitest'
import PermissionUsecase from '@/application/usecases/PermissionUsecase'
import InMemoryPermissionRepositoryAdapter from '@/infrastructure/driven/InMemoryPermissionRepositoryAdapter'
import type { Permission } from '@/domain/Permission'

function makePermission(overrides: Partial<Permission> = {}): Permission {
	return {
		id: 'perm-1',
		name: 'test-perm',
		resource: 'tool',
		resourceId: 'bash',
		action: 'allow',
		scope: 'project',
		scopeId: null,
		...overrides,
	}
}

describe('PermissionUsecase', () => {
	it('lists permissions', async () => {
		const repo = new InMemoryPermissionRepositoryAdapter()
		await repo.create(makePermission())
		const usecase = new PermissionUsecase(repo)
		const result = await usecase.list()
		expect(result.permissions).toHaveLength(1)
	})

	it('creates a permission', async () => {
		const repo = new InMemoryPermissionRepositoryAdapter()
		const usecase = new PermissionUsecase(repo)
		const result = await usecase.create({ permission: makePermission() })
		expect(result.permission.id).toBe('perm-1')
	})

	it('updates a permission', async () => {
		const repo = new InMemoryPermissionRepositoryAdapter()
		await repo.create(makePermission())
		const usecase = new PermissionUsecase(repo)
		const result = await usecase.update({
			id: 'perm-1',
			permission: makePermission({ action: 'deny' }),
		})
		expect(result.permission.action).toBe('deny')
	})
})
