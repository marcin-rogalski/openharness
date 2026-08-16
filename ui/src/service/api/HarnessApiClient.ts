import { z } from 'zod'
import { ProjectSchema, TimelineEntrySchema } from '../schema'
import type { HarnessApi, UpdateConfigInput } from './HarnessApi'

const ListProjectsResponseSchema = z.object({
	projects: z.array(ProjectSchema),
})

const SendMessageResponseSchema = z.object({
	entries: z.array(TimelineEntrySchema),
})

const HealthSchema = z.object({
	status: z.literal('ok'),
})

const HarnessConfigSchema = z.object({
	schemaVersion: z.literal(1),
	port: z.number().int().min(1).max(65535),
	projectsDir: z.string().min(1),
})

const GetConfigResponseSchema = z.object({
	config: HarnessConfigSchema,
})

const UpdateConfigResponseSchema = z.object({
	config: HarnessConfigSchema,
	restartRequired: z.boolean(),
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
		async health() {
			await request('/api/health', HealthSchema)
		},
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
		async getConfig() {
			const payload = await request('/api/config', GetConfigResponseSchema)
			return payload.config
		},
		async updateConfig(input: UpdateConfigInput) {
			return request('/api/config', UpdateConfigResponseSchema, {
				method: 'PUT',
				body: JSON.stringify(input),
			})
		},
	}
}
