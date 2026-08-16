import { describe, expect, it } from 'vitest'
import { createMockHarnessApi } from './MockHarnessApi'

describe('createMockHarnessApi', () => {
	it('returns the mock projects', async () => {
		const api = createMockHarnessApi()

		await expect(api.listProjects()).resolves.toEqual([
			{ id: 'project-1', name: 'OpenHarness', status: 'running' },
			{ id: 'project-2', name: 'Tempo', status: 'idle' },
		])
	})

	it('returns a user entry followed by mock agent entries', async () => {
		const api = createMockHarnessApi()

		const entries = await api.sendMessage('project-1', '  Hello  ')

		expect(entries.map((entry) => entry.type)).toEqual([
			'user_message',
			'agent_thinking',
			'agent_tool_call',
			'agent_tool_call',
			'agent_response',
		])
		expect(entries[0]).toMatchObject({
			projectId: 'project-1',
			content: 'Hello',
		})
	})

	it('rejects empty content', async () => {
		const api = createMockHarnessApi()

		await expect(api.sendMessage('project-1', '   ')).rejects.toThrow(
			'content must not be empty',
		)
	})

	it('reports health', async () => {
		const api = createMockHarnessApi()

		await expect(api.health()).resolves.toBeUndefined()
	})

	it('reads and updates the mock harness config', async () => {
		const api = createMockHarnessApi()

		await expect(api.getConfig()).resolves.toEqual({
			schemaVersion: 1,
			port: 3000,
			projectsDir: '~/.openharness/projects',
		})

		await expect(api.updateConfig({ port: 4000 })).resolves.toEqual({
			config: {
				schemaVersion: 1,
				port: 4000,
				projectsDir: '~/.openharness/projects',
			},
			restartRequired: true,
		})

		await expect(api.getConfig()).resolves.toMatchObject({ port: 4000 })
	})
})
