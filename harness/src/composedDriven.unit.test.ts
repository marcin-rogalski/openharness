import { describe, expect, it, vi } from 'vitest'
import type { ConfigRepositoryPort } from '@/application/ports/adapters/ConfigRepositoryPort'
import InMemoryProjectRepositoryAdapter from '@/infrastructure/driven/InMemoryProjectRepositoryAdapter'
import MockAgentRuntimeAdapter from '@/infrastructure/driven/MockAgentRuntimeAdapter'
import composeDriven from './composedDriven'

describe('composeDriven', () => {
	it('builds the driven adapters with default projects', async () => {
		const configRepository = {
			load: vi.fn(),
			save: vi.fn(),
		} as ConfigRepositoryPort
		const driven = await composeDriven(configRepository)

		expect(driven.projectRepository).toBeInstanceOf(
			InMemoryProjectRepositoryAdapter,
		)
		expect(driven.agentRuntime).toBeInstanceOf(MockAgentRuntimeAdapter)
		expect(driven.configRepository).toBe(configRepository)
		await expect(
			driven.projectRepository.findById('project-1'),
		).resolves.toMatchObject({
			id: 'project-1',
			name: 'OpenHarness',
		})
	})
})
