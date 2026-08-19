import { describe, expect, it, vi } from 'vitest'
import type { ProjectRepositoryPort } from '@/application/ports/adapters/ProjectRepositoryPort'
import CreateProjectUsecase from './CreateProjectUsecase'

describe('CreateProjectUsecase', () => {
	it('creates a project with idle status and returns it', async () => {
		const save = vi.fn().mockResolvedValue(undefined)
		const repository = {
			findById: vi.fn(),
			list: vi.fn(),
			save,
		} as unknown as ProjectRepositoryPort

		const usecase = new CreateProjectUsecase(repository)
		const output = await usecase.handle({ name: 'My Project' })

		expect(save).toHaveBeenCalledOnce()
		const saved = save.mock.calls[0][0]
		expect(saved.name).toBe('My Project')
		expect(saved.status).toBe('idle')
		expect(saved.id).toBeTypeOf('string')
		expect(output.project).toEqual(saved)
	})

	it('rejects empty name', async () => {
		const repository = {
			findById: vi.fn(),
			list: vi.fn(),
			save: vi.fn(),
		} as unknown as ProjectRepositoryPort

		const usecase = new CreateProjectUsecase(repository)

		await expect(usecase.handle({ name: '' })).rejects.toThrow()
	})
})
