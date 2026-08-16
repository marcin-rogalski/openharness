import { afterEach, describe, expect, it, vi } from 'vitest'
import { createHarnessApiClient } from './HarnessApiClient'

function jsonResponse(status: number, body: unknown) {
	return {
		ok: status >= 200 && status < 300,
		status,
		json: async () => body,
	} as Response
}

describe('createHarnessApiClient', () => {
	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('checks harness health', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(jsonResponse(200, { status: 'ok' }))
		vi.stubGlobal('fetch', fetchMock)
		const api = createHarnessApiClient()

		await expect(api.health()).resolves.toBeUndefined()

		expect(fetchMock).toHaveBeenCalledWith(
			'/api/health',
			expect.objectContaining({
				headers: { 'Content-Type': 'application/json' },
			}),
		)
	})

	it('lists projects from the harness API', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			jsonResponse(200, {
				projects: [{ id: 'project-1', name: 'OpenHarness', status: 'running' }],
			}),
		)
		vi.stubGlobal('fetch', fetchMock)
		const api = createHarnessApiClient()

		await expect(api.listProjects()).resolves.toEqual([
			{ id: 'project-1', name: 'OpenHarness', status: 'running' },
		])

		expect(fetchMock).toHaveBeenCalledWith(
			'/api/projects',
			expect.objectContaining({
				headers: { 'Content-Type': 'application/json' },
			}),
		)
	})

	it('sends a message to the selected project', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			jsonResponse(200, {
				entries: [
					{
						type: 'user_message',
						id: 'entry-1',
						projectId: 'project 1',
						content: 'Hello',
					},
				],
			}),
		)
		vi.stubGlobal('fetch', fetchMock)
		const api = createHarnessApiClient()

		await expect(api.sendMessage('project 1', 'Hello')).resolves.toEqual([
			{
				type: 'user_message',
				id: 'entry-1',
				projectId: 'project 1',
				content: 'Hello',
			},
		])

		expect(fetchMock).toHaveBeenCalledWith(
			'/api/projects/project%201/messages',
			expect.objectContaining({
				method: 'POST',
				body: JSON.stringify({ content: 'Hello' }),
			}),
		)
	})

	it('reads the harness config', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			jsonResponse(200, {
				config: {
					schemaVersion: 1,
					port: 3000,
					projectsDir: '/tmp/projects',
				},
			}),
		)
		vi.stubGlobal('fetch', fetchMock)
		const api = createHarnessApiClient()

		await expect(api.getConfig()).resolves.toEqual({
			schemaVersion: 1,
			port: 3000,
			projectsDir: '/tmp/projects',
		})

		expect(fetchMock).toHaveBeenCalledWith(
			'/api/config',
			expect.objectContaining({
				headers: { 'Content-Type': 'application/json' },
			}),
		)
	})

	it('updates the harness config', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			jsonResponse(200, {
				config: {
					schemaVersion: 1,
					port: 4000,
					projectsDir: '/tmp/projects',
				},
				restartRequired: true,
			}),
		)
		vi.stubGlobal('fetch', fetchMock)
		const api = createHarnessApiClient()

		await expect(api.updateConfig({ port: 4000 })).resolves.toEqual({
			config: {
				schemaVersion: 1,
				port: 4000,
				projectsDir: '/tmp/projects',
			},
			restartRequired: true,
		})

		expect(fetchMock).toHaveBeenCalledWith(
			'/api/config',
			expect.objectContaining({
				method: 'PUT',
				body: JSON.stringify({ port: 4000 }),
			}),
		)
	})

	it('throws the harness error message when the request fails', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(jsonResponse(500, { error: 'boom' }))
		vi.stubGlobal('fetch', fetchMock)
		const api = createHarnessApiClient()

		await expect(api.listProjects()).rejects.toThrow('boom')
	})

	it('falls back to a status message when the error payload has no message', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(jsonResponse(503, { message: 'nope' }))
		vi.stubGlobal('fetch', fetchMock)
		const api = createHarnessApiClient()

		await expect(api.listProjects()).rejects.toThrow(
			'Request failed with status 503',
		)
	})
})
