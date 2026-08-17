// Driven adapters — the application asks of others
// This file names all concrete driven adapter types.

import type { ConfigRepositoryPort } from '@/application/ports/adapters/ConfigRepositoryPort'
import type { Project } from '@/domain/Project'
import InMemoryEventLogAdapter from '@/infrastructure/driven/InMemoryEventLogAdapter'
import InMemoryProjectRepositoryAdapter from '@/infrastructure/driven/InMemoryProjectRepositoryAdapter'
import InMemorySessionRepositoryAdapter from '@/infrastructure/driven/InMemorySessionRepositoryAdapter'
import MockAgentRuntimeAdapter from '@/infrastructure/driven/MockAgentRuntimeAdapter'

const defaultProjects: Project[] = [
	{ id: 'project-1', name: 'OpenHarness', status: 'running' },
	{ id: 'project-2', name: 'Tempo', status: 'idle' },
]

export default async function composeDriven(
	configRepository: ConfigRepositoryPort,
) {
	return {
		projectRepository: new InMemoryProjectRepositoryAdapter(defaultProjects),
		sessionRepository: new InMemorySessionRepositoryAdapter(),
		eventLog: new InMemoryEventLogAdapter(),
		agentRuntime: new MockAgentRuntimeAdapter(),
		configRepository,
	}
}
