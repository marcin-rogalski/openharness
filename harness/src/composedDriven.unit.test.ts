import InMemoryProjectRepositoryAdapter from '@/infrastructure/driven/InMemoryProjectRepositoryAdapter'
import MockAgentRuntimeAdapter from '@/infrastructure/driven/MockAgentRuntimeAdapter'
import { describe, expect, it } from 'vitest'
import composeDriven from './composedDriven'

describe('composeDriven', () => {
	it('builds the driven adapters with default projects', async () => {
		const driven = await composeDriven()

		expect(driven.projectRepository).toBeInstanceOf(
			InMemoryProjectRepositoryAdapter,
		)
		expect(driven.agentRuntime).toBeInstanceOf(MockAgentRuntimeAdapter)
		await expect(
			driven.projectRepository.findById('project-1'),
		).resolves.toMatchObject({
			id: 'project-1',
			name: 'OpenHarness',
		})
	})
})
