import { harnessApiSchema } from '@openharness/contracts'
import { FetchClient } from '@openharness/fetch'
import { describe, expect, it } from 'vitest'

function requireBaseUrl(value: string | undefined, name: string): string {
	if (!value) {
		throw new Error(`${name} must be provided by the integration check`)
	}
	return value
}

describe('Docker Compose integration', () => {
	it('exposes the harness project API', async () => {
		const baseUrl = requireBaseUrl(
			process.env.HARNESS_BASE_URL,
			'HARNESS_BASE_URL',
		)
		const client = new FetchClient(harnessApiSchema, { baseUrl })

		const body = await client.request('listProjects')

		expect(body.projects).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					id: 'project-1',
					name: 'OpenHarness',
					status: 'running',
				}),
			]),
		)
	})

	it('sends a message through the harness API', async () => {
		const baseUrl = requireBaseUrl(
			process.env.HARNESS_BASE_URL,
			'HARNESS_BASE_URL',
		)
		const client = new FetchClient(harnessApiSchema, { baseUrl })

		const body = await client.request('sendMessage', {
			params: { projectId: 'project-1' },
			body: { content: 'integration check' },
		})

		expect(body.entries.map((entry) => entry.type)).toEqual(
			expect.arrayContaining(['user_message', 'agent_response']),
		)
	})

	it('proxies the project API through the UI service', async () => {
		const baseUrl = requireBaseUrl(process.env.UI_BASE_URL, 'UI_BASE_URL')
		const client = new FetchClient(harnessApiSchema, { baseUrl })

		const body = await client.request('listProjects')

		expect(body.projects).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ name: 'OpenHarness' }),
			]),
		)
	})

	it('sends a message through the UI proxy', async () => {
		const baseUrl = requireBaseUrl(process.env.UI_BASE_URL, 'UI_BASE_URL')
		const client = new FetchClient(harnessApiSchema, { baseUrl })

		const body = await client.request('sendMessage', {
			params: { projectId: 'project-1' },
			body: { content: 'ui proxy check' },
		})

		expect(body.entries.map((entry) => entry.type)).toEqual(
			expect.arrayContaining(['user_message', 'agent_response']),
		)
	})

	it('exposes the harness health API', async () => {
		const baseUrl = requireBaseUrl(
			process.env.HARNESS_BASE_URL,
			'HARNESS_BASE_URL',
		)
		const client = new FetchClient(harnessApiSchema, { baseUrl })

		await expect(client.request('health')).resolves.toEqual({
			status: 'ok',
		})
	})

	it('reads and updates the harness config API', async () => {
		const baseUrl = requireBaseUrl(
			process.env.HARNESS_BASE_URL,
			'HARNESS_BASE_URL',
		)
		const client = new FetchClient(harnessApiSchema, { baseUrl })

		const { config } = await client.request('getConfig')
		expect(config.schemaVersion).toBe(1)
		expect(config.port).toBeGreaterThan(0)
		expect(config.projectsDir).toBeTruthy()

		const updated = await client.request('updateConfig', {
			body: {
				port: config.port,
				projectsDir: config.projectsDir,
			},
		})
		expect(updated.config).toEqual(config)
		expect(updated.restartRequired).toBe(false)
	})

	it('proxies the health API through the UI service', async () => {
		const baseUrl = requireBaseUrl(process.env.UI_BASE_URL, 'UI_BASE_URL')
		const client = new FetchClient(harnessApiSchema, { baseUrl })

		await expect(client.request('health')).resolves.toEqual({
			status: 'ok',
		})
	})

	it('serves the built UI', async () => {
		const baseUrl = requireBaseUrl(process.env.UI_BASE_URL, 'UI_BASE_URL')

		const response = await fetch(`${baseUrl}/`)

		expect(response.status).toBe(200)
		expect(await response.text()).toContain('OpenHarness')
	})
})
