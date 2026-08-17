import { describe, expect, it } from 'vitest'
import InMemorySessionRepositoryAdapter from './InMemorySessionRepositoryAdapter'
import type { Session } from '@/domain/Session'

describe('InMemorySessionRepositoryAdapter', () => {
	it('returns a stored session', async () => {
		const repository = new InMemorySessionRepositoryAdapter()
		const session: Session = {
			id: 'session-1',
			projectId: 'project-1',
			status: 'active',
			createdAt: '2026-01-01T00:00:00Z',
			endedAt: null,
		}
		await repository.save(session)

		await expect(repository.findById('session-1')).resolves.toMatchObject({
			id: 'session-1',
			projectId: 'project-1',
		})
	})

	it('returns null when the session is missing', async () => {
		const repository = new InMemorySessionRepositoryAdapter()

		await expect(repository.findById('missing')).resolves.toBeNull()
	})

	it('finds an active session by project id', async () => {
		const repository = new InMemorySessionRepositoryAdapter()
		const active: Session = {
			id: 'session-1',
			projectId: 'project-1',
			status: 'active',
			createdAt: '2026-01-01T00:00:00Z',
			endedAt: null,
		}
		const ended: Session = {
			id: 'session-2',
			projectId: 'project-1',
			status: 'ended',
			createdAt: '2026-01-01T00:00:00Z',
			endedAt: '2026-01-01T01:00:00Z',
		}
		await repository.save(ended)
		await repository.save(active)

		await expect(
			repository.findActiveByProjectId('project-1'),
		).resolves.toMatchObject({ id: 'session-1' })
	})

	it('returns null when no active session exists for the project', async () => {
		const repository = new InMemorySessionRepositoryAdapter()
		const ended: Session = {
			id: 'session-1',
			projectId: 'project-1',
			status: 'ended',
			createdAt: '2026-01-01T00:00:00Z',
			endedAt: '2026-01-01T01:00:00Z',
		}
		await repository.save(ended)

		await expect(
			repository.findActiveByProjectId('project-1'),
		).resolves.toBeNull()
	})

	it('overwrites a session with the same id', async () => {
		const repository = new InMemorySessionRepositoryAdapter()
		const session: Session = {
			id: 'session-1',
			projectId: 'project-1',
			status: 'active',
			createdAt: '2026-01-01T00:00:00Z',
			endedAt: null,
		}
		await repository.save(session)

		const updated: Session = { ...session, status: 'ended' }
		await repository.save(updated)

		await expect(repository.findById('session-1')).resolves.toMatchObject({
			status: 'ended',
		})
	})
})
