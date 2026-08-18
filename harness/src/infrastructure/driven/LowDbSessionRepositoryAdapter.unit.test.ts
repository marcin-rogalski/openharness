import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { Session } from '@/domain/Session'
import LowDbSessionRepositoryAdapter from './LowDbSessionRepositoryAdapter'
import LowDbStore from './LowDbStore'

function makeSession(overrides: Partial<Session> = {}): Session {
	return {
		id: 'session-1',
		projectId: 'project-1',
		status: 'active',
		createdAt: '2025-01-01T00:00:00Z',
		endedAt: null,
		...overrides,
	}
}

describe('LowDbSessionRepositoryAdapter', () => {
	let dir: string
	let adapter: LowDbSessionRepositoryAdapter

	const setup = async () => {
		dir = mkdtempSync(join(tmpdir(), 'lowdb-session-'))
		const store = new LowDbStore(join(dir, 'data.json'))
		await store.init()
		adapter = new LowDbSessionRepositoryAdapter(store)
	}

	const teardown = () => {
		rmSync(dir, { recursive: true, force: true })
	}

	it('returns null for non-existent session', async () => {
		await setup()
		expect(await adapter.findById('missing')).toBeNull()
		teardown()
	})

	it('saves and retrieves a session', async () => {
		await setup()
		const session = makeSession()
		await adapter.save(session)

		expect(await adapter.findById('session-1')).toEqual(session)
		teardown()
	})

	it('finds active session by project id', async () => {
		await setup()
		const session = makeSession()
		await adapter.save(session)

		expect(
			await adapter.findActiveByProjectId('project-1'),
		).toEqual(session)
		teardown()
	})

	it('does not find ended session by project id', async () => {
		await setup()
		const session = makeSession({ status: 'ended' })
		await adapter.save(session)

		expect(
			await adapter.findActiveByProjectId('project-1'),
		).toBeNull()
		teardown()
	})

	it('updates an existing session on save', async () => {
		await setup()
		const session = makeSession()
		await adapter.save(session)

		const updated = makeSession({ status: 'ended' })
		await adapter.save(updated)

		expect(await adapter.findById('session-1')).toEqual(updated)
		teardown()
	})

})
