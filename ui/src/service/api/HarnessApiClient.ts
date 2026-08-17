import { harnessApiSchema } from '@openharness/contracts'
import { FetchClient } from '@openharness/fetch'
import type { HarnessApi } from './HarnessApi'

export function createHarnessApiClient(baseUrl = ''): HarnessApi {
	const client = new FetchClient(harnessApiSchema, { baseUrl })

	return {
		async health() {
			await client.request('health')
		},
		async listProjects() {
			const payload = await client.request('listProjects')
			return payload.projects
		},
		async sendMessage(projectId, content) {
			const payload = await client.request('sendMessage', {
				params: { projectId },
				body: { content },
			})
			return { sessionId: payload.sessionId, events: payload.events }
		},
		async getConfig() {
			const payload = await client.request('getConfig')
			return payload.config
		},
		async updateConfig(input) {
			return client.request('updateConfig', { body: input })
		},
	}
}
