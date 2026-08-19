import { describe, expect, it, vi } from 'vitest'
import type { ProjectRepositoryPort } from '@/application/ports/adapters/ProjectRepositoryPort'
import type { SessionRepositoryPort } from '@/application/ports/adapters/SessionRepositoryPort'
import DeleteProjectUsecase from '@/application/usecases/DeleteProjectUsecase'
import { ProjectNotFoundError } from '@/domain/ProjectNotFoundError'

describe('DeleteProjectUsecase', () => {
	it('deletes a project and all its sessions', async () => {
		const projects = {
			findById: vi
				.fn()
				.mockResolvedValue({ id: 'p1', name: 'Test', status: 'idle' }),
			list: vi.fn(),
			save: vi.fn(),
			delete: vi.fn().mockResolvedValue(undefined),
		} as unknown as ProjectRepositoryPort

		const sessions = {
			findById: vi.fn(),
			findActiveByProjectId: vi.fn(),
			listByProjectId: vi.fn().mockResolvedValue([
				{
					id: 's1',
					projectId: 'p1',
					status: 'active',
					createdAt: '',
					endedAt: null,
				},
				{
					id: 's2',
					projectId: 'p1',
					status: 'ended',
					createdAt: '',
					endedAt: '',
				},
			]),
			save: vi.fn(),
			delete: vi.fn().mockResolvedValue(undefined),
		} as unknown as SessionRepositoryPort

		const usecase = new DeleteProjectUsecase(projects, sessions)
		const result = await usecase.handle({ projectId: 'p1' })

		expect(result).toEqual({ ok: true })
		expect(sessions.delete).toHaveBeenCalledWith('s1')
		expect(sessions.delete).toHaveBeenCalledWith('s2')
		expect(projects.delete).toHaveBeenCalledWith('p1')
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

		const usecase = new DeleteProjectUsecase(projects, sessions)

		await expect(usecase.handle({ projectId: 'missing' })).rejects.toThrow(
			ProjectNotFoundError,
		)
	})
})
