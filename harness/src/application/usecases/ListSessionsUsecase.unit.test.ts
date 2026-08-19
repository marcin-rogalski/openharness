import { describe, expect, it, vi } from 'vitest'
import type { EventLogPort } from '@/application/ports/adapters/EventLogPort'
import type { SessionRepositoryPort } from '@/application/ports/adapters/SessionRepositoryPort'
import ListSessionsUsecase from './ListSessionsUsecase'

describe('ListSessionsUsecase', () => {
	it('returns session summaries with event counts', async () => {
		const sessions = [
			{
				id: 'session-1',
				projectId: 'project-1',
				status: 'active' as const,
				createdAt: '2025-01-01T00:00:00Z',
				endedAt: null,
			},
		]
		const events = [
			{ id: 'e1', timestamp: '2025-01-01T00:01:00Z' },
			{ id: 'e2', timestamp: '2025-01-01T00:02:00Z' },
		]
		const repository = {
			listByProjectId: vi.fn().mockResolvedValue(sessions),
		} as unknown as SessionRepositoryPort
		const eventLog = {
			listBySession: vi.fn().mockResolvedValue(events),
		} as unknown as EventLogPort

		const usecase = new ListSessionsUsecase(repository, eventLog)
		const output = await usecase.handle({ projectId: 'project-1' })

		expect(repository.listByProjectId).toHaveBeenCalledWith('project-1')
		expect(eventLog.listBySession).toHaveBeenCalledWith('session-1')
		expect(output).toEqual({
			sessions: [
				{
					id: 'session-1',
					projectId: 'project-1',
					status: 'active',
					createdAt: '2025-01-01T00:00:00Z',
					endedAt: null,
					eventCount: 2,
					lastEventAt: '2025-01-01T00:02:00Z',
				},
			],
		})
	})

	it('returns empty sessions array when no sessions exist', async () => {
		const repository = {
			listByProjectId: vi.fn().mockResolvedValue([]),
		} as unknown as SessionRepositoryPort
		const eventLog = {
			listBySession: vi.fn(),
		} as unknown as EventLogPort

		const usecase = new ListSessionsUsecase(repository, eventLog)
		const output = await usecase.handle({ projectId: 'project-1' })

		expect(output).toEqual({ sessions: [] })
	})

	it('returns null lastEventAt when session has no events', async () => {
		const sessions = [
			{
				id: 'session-1',
				projectId: 'project-1',
				status: 'ended' as const,
				createdAt: '2025-01-01T00:00:00Z',
				endedAt: '2025-01-02T00:00:00Z',
			},
		]
		const repository = {
			listByProjectId: vi.fn().mockResolvedValue(sessions),
		} as unknown as SessionRepositoryPort
		const eventLog = {
			listBySession: vi.fn().mockResolvedValue([]),
		} as unknown as EventLogPort

		const usecase = new ListSessionsUsecase(repository, eventLog)
		const output = await usecase.handle({ projectId: 'project-1' })

		expect(output.sessions[0].eventCount).toBe(0)
		expect(output.sessions[0].lastEventAt).toBeNull()
	})
})
