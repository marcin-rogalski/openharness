import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { Permission } from '@/domain/Permission'
import LowDbPermissionRepositoryAdapter from './LowDbPermissionRepositoryAdapter'
import LowDbStore from './LowDbStore'

function makePermission(overrides: Partial<Permission> = {}): Permission {
	return {
		id: 'perm-1',
		name: 'Test Permission',
		resource: 'tool',
		resourceId: 'bash',
		action: 'allow',
		scope: 'project',
		scopeId: null,
		...overrides,
	}
}

describe('LowDbPermissionRepositoryAdapter', () => {
	let dir: string
	let adapter: LowDbPermissionRepositoryAdapter

	const setup = async () => {
		dir = mkdtempSync(join(tmpdir(), 'lowdb-perm-'))
		const store = new LowDbStore(join(dir, 'data.json'))
		await store.init()
		adapter = new LowDbPermissionRepositoryAdapter(store)
	}

	const teardown = () => {
		rmSync(dir, { recursive: true, force: true })
	}

	it('returns empty list initially', async () => {
		await setup()
		expect(await adapter.list()).toEqual([])
		teardown()
	})

	it('creates and retrieves a permission', async () => {
		await setup()
		const permission = makePermission()
		await adapter.create(permission)

		expect(await adapter.get('perm-1')).toEqual(permission)
		expect(await adapter.list()).toHaveLength(1)
		teardown()
	})

	it('returns null for non-existent permission', async () => {
		await setup()
		expect(await adapter.get('missing')).toBeNull()
		teardown()
	})

	it('updates an existing permission', async () => {
		await setup()
		const permission = makePermission()
		await adapter.create(permission)

		const updated = makePermission({ action: 'deny' })
		await adapter.update('perm-1', updated)

		expect(await adapter.get('perm-1')).toEqual(updated)
		teardown()
	})

	it('throws when updating non-existent permission', async () => {
		await setup()
		await expect(
			adapter.update('missing', makePermission()),
		).rejects.toThrow('Permission not found: missing')
		teardown()
	})

})
