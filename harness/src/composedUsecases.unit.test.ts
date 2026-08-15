import ListProjectsUsecase from '@/application/usecases/ListProjectsUsecase'
import SendProjectMessageUsecase from '@/application/usecases/SendProjectMessageUsecase'
import { describe, expect, it } from 'vitest'
import composeDriven from './composedDriven'
import composeUsecases from './composedUsecases'

describe('composeUsecases', () => {
	it('builds the list projects usecase', async () => {
		const usecases = composeUsecases(await composeDriven())

		expect(usecases.listProjects).toBeInstanceOf(ListProjectsUsecase)

		await expect(usecases.listProjects.handle()).resolves.toEqual({
			projects: [
				{ id: 'project-1', name: 'OpenHarness', status: 'running' },
				{ id: 'project-2', name: 'Tempo', status: 'idle' },
			],
		})
	})

	it('builds the send project message usecase', async () => {
		const usecases = composeUsecases(await composeDriven())

		expect(usecases.sendProjectMessage).toBeInstanceOf(
			SendProjectMessageUsecase,
		)

		const result = await usecases.sendProjectMessage.handle({
			projectId: 'project-1',
			content: 'Hello',
		})

		expect(result.entries.map((entry) => entry.type)).toEqual([
			'user_message',
			'agent_thinking',
			'agent_tool_call',
			'agent_tool_call',
			'agent_response',
		])
	})
})
