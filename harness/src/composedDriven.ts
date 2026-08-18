// Driven adapters — the application asks of others
// This file names all concrete driven adapter types.

import { join } from 'node:path'
import type { ConfigRepositoryPort } from '@/application/ports/adapters/ConfigRepositoryPort'
import type { Project } from '@/domain/Project'
import AllowAllPolicyAdapter from '@/infrastructure/driven/AllowAllPolicyAdapter'
import InMemoryEventLogAdapter from '@/infrastructure/driven/InMemoryEventLogAdapter'
import InMemoryEventPublisherAdapter from '@/infrastructure/driven/InMemoryEventPublisherAdapter'
import InMemoryProjectRepositoryAdapter from '@/infrastructure/driven/InMemoryProjectRepositoryAdapter'
import LocalToolProviderAdapter from '@/infrastructure/driven/LocalToolProviderAdapter'
import LogicalPathSandboxAdapter from '@/infrastructure/driven/LogicalPathSandboxAdapter'
import LowDbAgentRepositoryAdapter from '@/infrastructure/driven/LowDbAgentRepositoryAdapter'
import LowDbBudgetRepositoryAdapter from '@/infrastructure/driven/LowDbBudgetRepositoryAdapter'
import LowDbPermissionRepositoryAdapter from '@/infrastructure/driven/LowDbPermissionRepositoryAdapter'
import LowDbRuleRepositoryAdapter from '@/infrastructure/driven/LowDbRuleRepositoryAdapter'
import LowDbSessionRepositoryAdapter from '@/infrastructure/driven/LowDbSessionRepositoryAdapter'
import LowDbStore from '@/infrastructure/driven/LowDbStore'
import ManualApprovalAdapter from '@/infrastructure/driven/ManualApprovalAdapter'
import MockAgentRuntimeAdapter from '@/infrastructure/driven/MockAgentRuntimeAdapter'
import OpenAiAgentRuntimeAdapter from '@/infrastructure/driven/OpenAiAgentRuntimeAdapter'
import PublishingEventLogAdapter from '@/infrastructure/driven/PublishingEventLogAdapter'

const defaultProjects: Project[] = [
	{ id: 'project-1', name: 'OpenHarness', status: 'running' },
	{ id: 'project-2', name: 'Tempo', status: 'idle' },
]

export default async function composeDriven(
	configRepository: ConfigRepositoryPort,
) {
	const toolProvider = new LocalToolProviderAdapter()
	const config = await configRepository.load()

	let agentRuntime:
		| InstanceType<typeof MockAgentRuntimeAdapter>
		| InstanceType<typeof OpenAiAgentRuntimeAdapter>

	if (config) {
		const slashIndex = config.defaultModel.indexOf('/')
		const providerName = config.defaultModel.slice(0, slashIndex)
		const modelId = config.defaultModel.slice(slashIndex + 1)
		const provider = config.providers[providerName]

		if (provider) {
			const apiKey = process.env.OPENAI_API_KEY ?? 'none'
			agentRuntime = new OpenAiAgentRuntimeAdapter(
				apiKey,
				modelId,
				provider.url,
			)
		} else {
			agentRuntime = new MockAgentRuntimeAdapter()
		}
	} else {
		agentRuntime = new MockAgentRuntimeAdapter()
	}

	const workspaceRoot = config?.projectsDir ?? '.'
	const store = new LowDbStore(join(workspaceRoot, 'data.json'))
	await store.init()

	const eventPublisher = new InMemoryEventPublisherAdapter()
	const eventLog = new PublishingEventLogAdapter(
		new InMemoryEventLogAdapter(),
		eventPublisher,
	)

	return {
		projectRepository: new InMemoryProjectRepositoryAdapter(defaultProjects),
		sessionRepository: new LowDbSessionRepositoryAdapter(store),
		eventLog,
		eventPublisher,
		agentRuntime,
		configRepository,
		toolRegistry: toolProvider,
		toolExecutor: toolProvider,
		policy: new AllowAllPolicyAdapter(),
		approval: new ManualApprovalAdapter(),
		sandbox: new LogicalPathSandboxAdapter({
			level: 'workspace-write',
			workspaceRoot,
		}),
		agentRepository: new LowDbAgentRepositoryAdapter(store),
		ruleRepository: new LowDbRuleRepositoryAdapter(store),
		budgetRepository: new LowDbBudgetRepositoryAdapter(store),
		permissionRepository: new LowDbPermissionRepositoryAdapter(store),
	}
}
