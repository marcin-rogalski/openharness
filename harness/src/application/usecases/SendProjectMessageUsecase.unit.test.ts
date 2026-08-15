import type { AgentRuntimePort } from '@/application/ports/adapters/AgentRuntimePort'
import type { ProjectRepositoryPort } from '@/application/ports/adapters/ProjectRepositoryPort'
import { ProjectNotFoundError } from '@/domain/ProjectNotFoundError'
import { describe, expect, it } from 'vitest'
import SendProjectMessageUsecase from './SendProjectMessageUsecase'

function createProjectRepository(project: { id: string } | null) {
	return {
		findById: async (id: string) =>
			project && project.id === id
				? { id: project.id, name: 'Test', status: 'idle' as const }
				: null,
		list: async () => [],
	} as ProjectRepositoryPort
}

function createAgentRuntime() {
	return {
		handle: async ({
			projectId,
			content,
		}: { projectId: string; content: string }) => [
			{
				type: 'agent_response' as const,
				id: 'agent-1',
				projectId,
				text: `Mock response to: ${content}`,
			},
		],
	} as AgentRuntimePort
}

describe('SendProjectMessageUsecase', () => {
	it('returns a user entry followed by agent entries', async () => {
		const usecase = new SendProjectMessageUsecase(
			createProjectRepository({ id: 'project-1' }),
			createAgentRuntime(),
		)

		const result = await usecase.handle({
			projectId: 'project-1',
			content: 'Hello',
		})

		expect(result.entries.map((entry) => entry.type)).toEqual([
			'user_message',
			'agent_response',
		])
		expect(result.entries[0]).toMatchObject({
			projectId: 'project-1',
			content: 'Hello',
		})
		expect(result.entries[1]).toMatchObject({
			projectId: 'project-1',
			text: 'Mock response to: Hello',
		})
	})

	it('trims message content before handling', async () => {
		const usecase = new SendProjectMessageUsecase(
			createProjectRepository({ id: 'project-1' }),
			createAgentRuntime(),
		)

		const result = await usecase.handle({
			projectId: 'project-1',
			content: '  Hello  ',
		})

		expect(result.entries[0]).toMatchObject({ content: 'Hello' })
		expect(result.entries[1]).toMatchObject({ text: 'Mock response to: Hello' })
	})

	it('rejects empty content', async () => {
		const usecase = new SendProjectMessageUsecase(
			createProjectRepository({ id: 'project-1' }),
			createAgentRuntime(),
		)

		await expect(
			usecase.handle({ projectId: 'project-1', content: '   ' }),
		).rejects.toThrow()
	})

	it('throws when the project does not exist', async () => {
		const usecase = new SendProjectMessageUsecase(
			createProjectRepository(null),
			createAgentRuntime(),
		)

		await expect(
			usecase.handle({ projectId: 'missing', content: 'Hello' }),
		).rejects.toThrow(ProjectNotFoundError)
	})
})
