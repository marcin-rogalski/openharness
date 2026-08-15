import { describe, expect, it } from 'vitest'
import InMemoryProjectRepositoryAdapter from './InMemoryProjectRepositoryAdapter'

describe('InMemoryProjectRepositoryAdapter', () => {
	it('returns a stored project', async () => {
		const repository = new InMemoryProjectRepositoryAdapter([
			{ id: 'project-1', name: 'OpenHarness', status: 'running' },
		])

		await expect(repository.findById('project-1')).resolves.toMatchObject({
			id: 'project-1',
			name: 'OpenHarness',
		})
	})

	it('returns null when the project is missing', async () => {
		const repository = new InMemoryProjectRepositoryAdapter([])

		await expect(repository.findById('missing')).resolves.toBeNull()
	})
})
