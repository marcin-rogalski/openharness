import { describe, expect, it } from 'vitest'

interface Project {
	id: string
	name: string
	status: string
}

interface ListProjectsResponse {
	projects: Project[]
}

interface SendMessageResponse {
	entries: Array<{ type: string }>
}

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

		const response = await fetch(`${baseUrl}/api/projects`)

		expect(response.status).toBe(200)
		const body = (await response.json()) as ListProjectsResponse
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

		const response = await fetch(`${baseUrl}/api/projects/project-1/messages`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ content: 'integration check' }),
		})

		expect(response.status).toBe(200)
		const body = (await response.json()) as SendMessageResponse
		expect(body.entries.map((entry) => entry.type)).toEqual(
			expect.arrayContaining(['user_message', 'agent_response']),
		)
	})

	it('proxies the project API through the UI service', async () => {
		const baseUrl = requireBaseUrl(process.env.UI_BASE_URL, 'UI_BASE_URL')

		const response = await fetch(`${baseUrl}/api/projects`)

		expect(response.status).toBe(200)
		const body = (await response.json()) as ListProjectsResponse
		expect(body.projects).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ name: 'OpenHarness' }),
			]),
		)
	})

	it('sends a message through the UI proxy', async () => {
		const baseUrl = requireBaseUrl(process.env.UI_BASE_URL, 'UI_BASE_URL')

		const response = await fetch(`${baseUrl}/api/projects/project-1/messages`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ content: 'ui proxy check' }),
		})

		expect(response.status).toBe(200)
		const body = (await response.json()) as SendMessageResponse
		expect(body.entries.map((entry) => entry.type)).toEqual(
			expect.arrayContaining(['user_message', 'agent_response']),
		)
	})

	it('serves the built UI', async () => {
		const baseUrl = requireBaseUrl(process.env.UI_BASE_URL, 'UI_BASE_URL')

		const response = await fetch(`${baseUrl}/`)

		expect(response.status).toBe(200)
		expect(await response.text()).toContain('OpenHarness')
	})
})
