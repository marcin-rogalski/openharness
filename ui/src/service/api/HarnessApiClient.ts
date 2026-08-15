import { z } from 'zod'
import { ProjectSchema, TimelineEntrySchema } from '../schema'
import type { HarnessApi } from './HarnessApi'

const ListProjectsResponseSchema = z.object({
	projects: z.array(ProjectSchema),
})

const SendMessageResponseSchema = z.object({
	entries: z.array(TimelineEntrySchema),
})

function getErrorMessage(payload: unknown, status: number): string {
	if (
		typeof payload === 'object' &&
		payload !== null &&
		'error' in payload &&
		typeof payload.error === 'string'
	) {
		return payload.error
	}
	return `Request failed with status ${status}`
}

export function createHarnessApiClient(baseUrl = ''): HarnessApi {
	async function request<T>(
		path: string,
		schema: z.ZodType<T>,
		init?: RequestInit,
	): Promise<T> {
		const response = await fetch(`${baseUrl}${path}`, {
			headers: { 'Content-Type': 'application/json' },
			...init,
		})
		const payload: unknown = await response.json()

		if (!response.ok) {
			throw new Error(getErrorMessage(payload, response.status))
		}

		return schema.parse(payload)
	}

	return {
		async listProjects() {
			const payload = await request('/api/projects', ListProjectsResponseSchema)
			return payload.projects
		},
		async sendMessage(projectId, content) {
			const payload = await request(
				`/api/projects/${encodeURIComponent(projectId)}/messages`,
				SendMessageResponseSchema,
				{
					method: 'POST',
					body: JSON.stringify({ content }),
				},
			)
			return payload.entries
		},
	}
}
