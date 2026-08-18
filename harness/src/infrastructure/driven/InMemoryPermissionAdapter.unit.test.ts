import { describe, expect, it } from 'vitest'
import InMemoryPermissionAdapter from '@/infrastructure/driven/InMemoryPermissionAdapter'
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

describe('InMemoryPermissionAdapter', () => {
	it('allows when no permissions are configured', async () => {
		const adapter = new InMemoryPermissionAdapter([])
		const result = await adapter.check('tool', 'bash', 'project', null)
		expect(result.action).toBe('allow')
	})

	it('returns the matching permission action', async () => {
		const adapter = new InMemoryPermissionAdapter([
			makePermission({ action: 'deny', resourceId: 'bash' }),
		])
		const result = await adapter.check('tool', 'bash', 'project', null)
		expect(result.action).toBe('deny')
	})

	it('prefers session scope over project scope', async () => {
		const adapter = new InMemoryPermissionAdapter([
			makePermission({ id: 'p1', action: 'allow', scope: 'project', scopeId: null }),
			makePermission({ id: 'p2', action: 'deny', scope: 'session', scopeId: 'sess-1' }),
		])
		const result = await adapter.check('tool', 'bash', 'session', 'sess-1')
		expect(result.action).toBe('deny')
	})

	it('prefers agent scope over project scope', async () => {
		const adapter = new InMemoryPermissionAdapter([
			makePermission({ id: 'p1', action: 'allow', scope: 'project', scopeId: null }),
			makePermission({ id: 'p2', action: 'require_approval', scope: 'agent', scopeId: 'agent-1' }),
		])
		const result = await adapter.check('tool', 'bash', 'agent', 'agent-1')
		expect(result.action).toBe('require_approval')
	})

	it('matches by resource type and id', async () => {
		const adapter = new InMemoryPermissionAdapter([
			makePermission({ resource: 'sandbox', resourceId: 'workspace-write', action: 'deny' }),
		])
		const toolResult = await adapter.check('tool', 'bash', 'project', null)
		expect(toolResult.action).toBe('allow')
		const sandboxResult = await adapter.check('sandbox', 'workspace-write', 'project', null)
		expect(sandboxResult.action).toBe('deny')
	})

	it('returns allow with null reason when no match', async () => {
		const adapter = new InMemoryPermissionAdapter([
			makePermission({ resourceId: 'other-tool' }),
		])
		const result = await adapter.check('tool', 'bash', 'project', null)
		expect(result.action).toBe('allow')
		expect(result.reason).toBeNull()
	})
})
