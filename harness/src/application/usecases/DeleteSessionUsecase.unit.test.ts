import { describe, expect, it, vi } from 'vitest'
import type { ProjectRepositoryPort } from '@/application/ports/adapters/ProjectRepositoryPort'
import type { SessionRepositoryPort } from '@/application/ports/adapters/SessionRepositoryPort'
import DeleteSessionUsecase from '@/application/usecases/DeleteSessionUsecase'
import { ProjectNotFoundError } from '@/domain/ProjectNotFoundError'
import { SessionNotFoundError } from '@/domain/SessionNotFoundError'

describe('DeleteSessionUsecase', () => {
	it('deletes a session that belongs to the project', async () => {
		const projects = {
			findById: vi
				.fn()
				.mockResolvedValue({ id: 'p1', name: 'Test', status: 'idle' }),
			list: vi.fn(),
			save: vi.fn(),
			delete: vi.fn(),
		} as unknown as ProjectRepositoryPort

		const sessions = {
			findById: vi.fn().mockResolvedValue({
				id: 's1',
				projectId: 'p1',
				status: 'active',
				createdAt: '',
				endedAt: null,
			}),
			findActiveByProjectId: vi.fn(),
			listByProjectId: vi.fn(),
			save: vi.fn(),
			delete: vi.fn().mockResolvedValue(undefined),
		} as unknown as SessionRepositoryPort

		const usecase = new DeleteSessionUsecase(projects, sessions)
		const result = await usecase.handle({ projectId: 'p1', sessionId: 's1' })

		expect(result).toEqual({ ok: true })
		expect(sessions.delete).toHaveBeenCalledWith('s1')
	})

	it('throws ProjectNotFoundError when project does not exist', async () => {
		const projects = {
			findById: vi.fn().mockResolvedValue(null),
			list: vi.fn(),
			save: vi.fn(),
			delete: vi.fn(),
		} as unknown as ProjectRepositoryPort

		const sessions = {
			findById: vi.fn(),
			findActiveByProjectId: vi.fn(),
			listByProjectId: vi.fn(),
			save: vi.fn(),
			delete: vi.fn(),
		} as unknown as SessionRepositoryPort

		const usecase = new DeleteSessionUsecase(projects, sessions)

		await expect(
			usecase.handle({ projectId: 'missing', sessionId: 's1' }),
		).rejects.toThrow(ProjectNotFoundError)
	})

	it('throws SessionNotFoundError when session does not exist', async () => {
		const projects = {
			findById: vi
				.fn()
				.mockResolvedValue({ id: 'p1', name: 'Test', status: 'idle' }),
			list: vi.fn(),
			save: vi.fn(),
			delete: vi.fn(),
		} as unknown as ProjectRepositoryPort

		const sessions = {
			findById: vi.fn().mockResolvedValue(null),
			findActiveByProjectId: vi.fn(),
			listByProjectId: vi.fn(),
			save: vi.fn(),
			delete: vi.fn(),
		} as unknown as SessionRepositoryPort

		const usecase = new DeleteSessionUsecase(projects, sessions)

		await expect(
			usecase.handle({ projectId: 'p1', sessionId: 'missing' }),
		).rejects.toThrow(SessionNotFoundError)
	})

	it('throws SessionNotFoundError when session belongs to a different project', async () => {
		const projects = {
			findById: vi
				.fn()
				.mockResolvedValue({ id: 'p1', name: 'Test', status: 'idle' }),
			list: vi.fn(),
			save: vi.fn(),
			delete: vi.fn(),
		} as unknown as ProjectRepositoryPort

		const sessions = {
			findById: vi.fn().mockResolvedValue({
				id: 's1',
				projectId: 'p2',
				status: 'active',
				createdAt: '',
				endedAt: null,
			}),
			findActiveByProjectId: vi.fn(),
			listByProjectId: vi.fn(),
			save: vi.fn(),
			delete: vi.fn(),
		} as unknown as SessionRepositoryPort

		const usecase = new DeleteSessionUsecase(projects, sessions)

		await expect(
			usecase.handle({ projectId: 'p1', sessionId: 's1' }),
		).rejects.toThrow(SessionNotFoundError)
	})
})
