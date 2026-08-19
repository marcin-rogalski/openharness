import { describe, expect, it, vi } from 'vitest'
import type { EventLogPort } from '@/application/ports/adapters/EventLogPort'
import type { ProjectRepositoryPort } from '@/application/ports/adapters/ProjectRepositoryPort'
import type { SessionRepositoryPort } from '@/application/ports/adapters/SessionRepositoryPort'
import { ProjectNotFoundError } from '@/domain/ProjectNotFoundError'
import CreateSessionUsecase from './CreateSessionUsecase'

function createProjectRepository(project: unknown = null) {
	return {
		findById: vi.fn().mockResolvedValue(project),
	} as unknown as ProjectRepositoryPort
}

function createSessionRepository() {
	return {
		save: vi.fn().mockResolvedValue(undefined),
	} as unknown as SessionRepositoryPort
}

function createEventLog() {
	return {
		append: vi.fn().mockResolvedValue(undefined),
	} as unknown as EventLogPort
}

describe('CreateSessionUsecase', () => {
	it('creates a session for an existing project', async () => {
		const project = { id: 'project-1', name: 'Test', status: 'idle' as const }
		const projects = createProjectRepository(project)
		const sessions = createSessionRepository()
		const eventLog = createEventLog()

		const usecase = new CreateSessionUsecase(projects, sessions, eventLog)
		const result = await usecase.handle({ projectId: 'project-1' })

		expect(result.session).toMatchObject({
			projectId: 'project-1',
			status: 'active',
			endedAt: null,
		})
		expect(result.session.id).toBeTypeOf('string')
		expect(result.session.createdAt).toBeTypeOf('string')
		expect(sessions.save).toHaveBeenCalledOnce()
		expect(eventLog.append).toHaveBeenCalledOnce()
	})

	it('throws ProjectNotFoundError for a missing project', async () => {
		const projects = createProjectRepository(null)
		const sessions = createSessionRepository()
		const eventLog = createEventLog()

		const usecase = new CreateSessionUsecase(projects, sessions, eventLog)

		await expect(usecase.handle({ projectId: 'missing' })).rejects.toThrow(
			ProjectNotFoundError,
		)
	})
})
