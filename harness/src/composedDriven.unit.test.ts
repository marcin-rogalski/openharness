import { describe, expect, it, vi } from 'vitest'
import type { ConfigRepositoryPort } from '@/application/ports/adapters/ConfigRepositoryPort'
import InMemoryProjectRepositoryAdapter from '@/infrastructure/driven/InMemoryProjectRepositoryAdapter'
import LocalToolProviderAdapter from '@/infrastructure/driven/LocalToolProviderAdapter'
import ManualApprovalAdapter from '@/infrastructure/driven/ManualApprovalAdapter'
import MockAgentRuntimeAdapter from '@/infrastructure/driven/MockAgentRuntimeAdapter'
import PermissionPolicyAdapter from '@/infrastructure/driven/PermissionPolicyAdapter'
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

	it('builds the tool adapters', async () => {
		const configRepository = {
			load: vi.fn(),
			save: vi.fn(),
		} as ConfigRepositoryPort
		const driven = await composeDriven(configRepository)

		expect(driven.toolRegistry).toBeInstanceOf(LocalToolProviderAdapter)
		expect(driven.toolExecutor).toBeInstanceOf(LocalToolProviderAdapter)
		expect(driven.policy).toBeInstanceOf(PermissionPolicyAdapter)
		expect(driven.approval).toBeInstanceOf(ManualApprovalAdapter)
	})
})
