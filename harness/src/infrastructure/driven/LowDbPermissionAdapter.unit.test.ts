import { describe, expect, it } from 'vitest'
import type { PermissionRepositoryPort } from '@/application/ports/adapters/PermissionRepositoryPort'
import type { Permission } from '@/domain/Permission'
import LowDbPermissionAdapter from './LowDbPermissionAdapter'

function createRepository(permissions: Permission[]) {
	return {
		list: async () => permissions,
		get: async (id: string) => permissions.find((p) => p.id === id) ?? null,
		create: async (p: Permission) => p,
		update: async (_id: string, p: Permission) => p,
	} as PermissionRepositoryPort
}

function createPermission(overrides: Partial<Permission> = {}): Permission {
	return {
		id: 'perm-1',
		name: 'test',
		resource: 'tool',
		resourceId: 'bash',
		action: 'require_approval',
		scope: 'project',
		scopeId: null,
		...overrides,
	}
}

describe('LowDbPermissionAdapter', () => {
	it('returns require_approval when no permission exists for the tool', async () => {
		const adapter = new LowDbPermissionAdapter(createRepository([]))
		const result = await adapter.check('tool', 'bash', 'project', null)

		expect(result.action).toBe('require_approval')
	})

	it('returns the stored action when a permission matches', async () => {
		const adapter = new LowDbPermissionAdapter(
			createRepository([createPermission({ action: 'allow' })]),
		)
		const result = await adapter.check('tool', 'bash', 'project', null)

		expect(result.action).toBe('allow')
	})

	it('returns deny when the stored action is deny', async () => {
		const adapter = new LowDbPermissionAdapter(
			createRepository([createPermission({ action: 'deny' })]),
		)
		const result = await adapter.check('tool', 'bash', 'project', null)

		expect(result.action).toBe('deny')
	})

	it('prefers higher-scope permissions (session > agent > project)', async () => {
		const permissions = [
			createPermission({
				id: 'p1',
				scope: 'project',
				scopeId: null,
				action: 'allow',
			}),
			createPermission({
				id: 'p2',
				scope: 'session',
				scopeId: 's1',
				action: 'deny',
			}),
		]
		const adapter = new LowDbPermissionAdapter(createRepository(permissions))
		const result = await adapter.check('tool', 'bash', 'session', 's1')

		expect(result.action).toBe('deny')
	})

	it('ignores permissions for different resources', async () => {
		const adapter = new LowDbPermissionAdapter(
			createRepository([
				createPermission({ resource: 'sandbox', resourceId: 'bash' }),
			]),
		)
		const result = await adapter.check('tool', 'bash', 'project', null)

		expect(result.action).toBe('require_approval')
	})

	it('ignores permissions for different resourceIds', async () => {
		const adapter = new LowDbPermissionAdapter(
			createRepository([createPermission({ resourceId: 'other_tool' })]),
		)
		const result = await adapter.check('tool', 'bash', 'project', null)

		expect(result.action).toBe('require_approval')
	})
})
