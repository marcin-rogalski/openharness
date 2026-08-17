import { describe, expect, it } from 'vitest'
import type { SandboxPolicy } from '@/domain/Sandbox'
import { SandboxUnavailableError } from '@/domain/SandboxUnavailableError'
import LogicalPathSandboxAdapter from './LogicalPathSandboxAdapter'

function createAdapter(policy: Partial<SandboxPolicy> = {}) {
	return new LogicalPathSandboxAdapter({
		level: 'workspace-write',
		workspaceRoot: '/workspace',
		...policy,
	})
}

describe('LogicalPathSandboxAdapter', () => {
	it('allows access when required level is none', async () => {
		const adapter = createAdapter()
		const result = await adapter.checkAccess('none')
		expect(result.allowed).toBe(true)
		expect(result.reason).toBeNull()
	})

	it('denies when required level exceeds session level', async () => {
		const adapter = createAdapter({ level: 'read-only' })
		const result = await adapter.checkAccess('workspace-write')
		expect(result.allowed).toBe(false)
		expect(result.reason).toContain('requires')
	})

	it('denies write when session is read-only', async () => {
		const adapter = createAdapter({ level: 'read-only' })
		const result = await adapter.checkAccess(
			'workspace-write',
			'/workspace/file.txt',
		)
		expect(result.allowed).toBe(false)
		expect(result.reason).toContain('read-only')
	})

	it('allows workspace-write within workspace root', async () => {
		const adapter = createAdapter({
			level: 'workspace-write',
			workspaceRoot: '/workspace',
		})
		const result = await adapter.checkAccess(
			'workspace-write',
			'/workspace/file.txt',
		)
		expect(result.allowed).toBe(true)
		expect(result.reason).toBeNull()
	})

	it('denies workspace-write outside workspace root', async () => {
		const adapter = createAdapter({
			level: 'workspace-write',
			workspaceRoot: '/workspace',
		})
		const result = await adapter.checkAccess('workspace-write', '/etc/passwd')
		expect(result.allowed).toBe(false)
		expect(result.reason).toContain('outside workspace')
	})

	it('denies workspace-write when path is a sibling of workspace root', async () => {
		const adapter = createAdapter({
			level: 'workspace-write',
			workspaceRoot: '/workspace',
		})
		const result = await adapter.checkAccess(
			'workspace-write',
			'/workspace-evil/file.txt',
		)
		expect(result.allowed).toBe(false)
		expect(result.reason).toContain('outside workspace')
	})

	it('throws SandboxUnavailableError when workspace root is missing for write', async () => {
		const adapter = createAdapter({
			level: 'workspace-write',
			workspaceRoot: '',
		})
		await expect(
			adapter.checkAccess('workspace-write', '/workspace/file.txt'),
		).rejects.toThrow(SandboxUnavailableError)
	})

	it('allows full access when session level is full', async () => {
		const adapter = createAdapter({
			level: 'full',
			workspaceRoot: '/workspace',
		})
		const result = await adapter.checkAccess('full', '/etc/passwd')
		expect(result.allowed).toBe(true)
		expect(result.reason).toBeNull()
	})

	it('allows read-only access when session level is read-only', async () => {
		const adapter = createAdapter({ level: 'read-only' })
		const result = await adapter.checkAccess('read-only', '/workspace/file.txt')
		expect(result.allowed).toBe(true)
		expect(result.reason).toBeNull()
	})

	it('allows workspace-write with no path when workspace root is set', async () => {
		const adapter = createAdapter({
			level: 'workspace-write',
			workspaceRoot: '/workspace',
		})
		const result = await adapter.checkAccess('workspace-write')
		expect(result.allowed).toBe(true)
		expect(result.reason).toBeNull()
	})

	it('denies full access when session level is workspace-write', async () => {
		const adapter = createAdapter({
			level: 'workspace-write',
			workspaceRoot: '/workspace',
		})
		const result = await adapter.checkAccess('full')
		expect(result.allowed).toBe(false)
		expect(result.reason).toContain('requires')
	})
})
