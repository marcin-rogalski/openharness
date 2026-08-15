import type { ProjectRepositoryPort } from '@/application/ports/adapters/ProjectRepositoryPort'
import { describe, expect, it } from 'vitest'
import ListProjectsUsecase from './ListProjectsUsecase'

describe('ListProjectsUsecase', () => {
	it('returns all projects from the repository', async () => {
		const projects = [
			{ id: 'project-1', name: 'OpenHarness', status: 'running' as const },
			{ id: 'project-2', name: 'Tempo', status: 'idle' as const },
		]
		const repository = {
			findById: async () => null,
			list: async () => projects,
		} as ProjectRepositoryPort

		const usecase = new ListProjectsUsecase(repository)

		await expect(usecase.handle()).resolves.toEqual({ projects })
	})

	it('returns an empty list when no projects exist', async () => {
		const repository = {
			findById: async () => null,
			list: async () => [],
		} as ProjectRepositoryPort

		const usecase = new ListProjectsUsecase(repository)

		await expect(usecase.handle()).resolves.toEqual({ projects: [] })
	})
})
