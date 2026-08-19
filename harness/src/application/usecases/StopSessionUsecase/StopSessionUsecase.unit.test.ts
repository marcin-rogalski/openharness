import { describe, expect, it } from 'vitest'
import type { ProjectRepositoryPort } from '@/application/ports/adapters/ProjectRepositoryPort'
import type { SessionRepositoryPort } from '@/application/ports/adapters/SessionRepositoryPort'
import ActiveTurnRegistry from '@/application/services/ActiveTurnRegistry'
import { ProjectNotFoundError } from '@/domain/ProjectNotFoundError'
import type { Session } from '@/domain/Session'
import { SessionNotFoundError } from '@/domain/SessionNotFoundError'
import StopSessionUsecase from '.'

function createProjectRepository(project: { id: string } | null) {
	return {
		findById: async (id: string) =>
			project && project.id === id
				? { id: project.id, name: 'Test', status: 'idle' as const }
				: null,
		list: async () => [],
	} as ProjectRepositoryPort
}

function createSessionRepository(session: Session | null = null) {
	return {
		findById: async (id: string) =>
			session && session.id === id ? session : null,
		findActiveByProjectId: async () => null,
		listByProjectId: async () => [],
		save: async () => {},
		delete: async () => {},
	} as SessionRepositoryPort
}

describe('StopSessionUsecase', () => {
	it('aborts the active turn and returns ok', async () => {
		const session: Session = {
			id: 'session-1',
			projectId: 'project-1',
			status: 'active',
			createdAt: '2026-01-01T00:00:00Z',
			endedAt: null,
		}
		const activeTurns = new ActiveTurnRegistry()
		const controller = new AbortController()
		activeTurns.register('session-1', controller)

		const usecase = new StopSessionUsecase(
			createProjectRepository({ id: 'project-1' }),
			createSessionRepository(session),
			activeTurns,
		)

		const result = await usecase.handle({
			projectId: 'project-1',
			sessionId: 'session-1',
		})

		expect(result).toEqual({ ok: true })
		expect(controller.signal.aborted).toBe(true)
		expect(activeTurns.has('session-1')).toBe(false)
	})

	it('returns ok even when no active turn exists', async () => {
		const session: Session = {
			id: 'session-1',
			projectId: 'project-1',
			status: 'active',
			createdAt: '2026-01-01T00:00:00Z',
			endedAt: null,
		}
		const usecase = new StopSessionUsecase(
			createProjectRepository({ id: 'project-1' }),
			createSessionRepository(session),
			new ActiveTurnRegistry(),
		)

		const result = await usecase.handle({
			projectId: 'project-1',
			sessionId: 'session-1',
		})

		expect(result).toEqual({ ok: true })
	})

	it('throws when the project does not exist', async () => {
		const usecase = new StopSessionUsecase(
			createProjectRepository(null),
			createSessionRepository(),
			new ActiveTurnRegistry(),
		)

		await expect(
			usecase.handle({ projectId: 'missing', sessionId: 'session-1' }),
		).rejects.toThrow(ProjectNotFoundError)
	})

	it('throws when the session does not exist', async () => {
		const usecase = new StopSessionUsecase(
			createProjectRepository({ id: 'project-1' }),
			createSessionRepository(null),
			new ActiveTurnRegistry(),
		)

		await expect(
			usecase.handle({ projectId: 'project-1', sessionId: 'missing' }),
		).rejects.toThrow(SessionNotFoundError)
	})

	it('throws when the session belongs to a different project', async () => {
		const session: Session = {
			id: 'session-1',
			projectId: 'other-project',
			status: 'active',
			createdAt: '2026-01-01T00:00:00Z',
			endedAt: null,
		}
		const usecase = new StopSessionUsecase(
			createProjectRepository({ id: 'project-1' }),
			createSessionRepository(session),
			new ActiveTurnRegistry(),
		)

		await expect(
			usecase.handle({ projectId: 'project-1', sessionId: 'session-1' }),
		).rejects.toThrow(SessionNotFoundError)
	})
})
