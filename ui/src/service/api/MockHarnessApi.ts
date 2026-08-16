import { mockState } from '../mock'
import { createMockTimelineEntries } from '../mockTimeline'
import type { HarnessApi, HarnessConfig, UpdateConfigInput } from './HarnessApi'

export function createMockHarnessApi(): HarnessApi {
	let config: HarnessConfig = {
		schemaVersion: 1,
		port: 3000,
		projectsDir: '~/.openharness/projects',
	}

	return {
		async health() {
			return undefined
		},
		async listProjects() {
			return mockState.projects
		},
		async sendMessage(projectId, content) {
			const trimmed = content.trim()
			if (!trimmed) {
				throw new Error('content must not be empty')
			}

			return [
				{
					type: 'user_message',
					id: crypto.randomUUID(),
					projectId,
					content: trimmed,
				},
				...createMockTimelineEntries(projectId, trimmed),
			]
		},
		async getConfig() {
			return config
		},
		async updateConfig(input: UpdateConfigInput) {
			const restartRequired =
				input.port !== undefined && input.port !== config.port
			config = {
				...config,
				...input,
			}
			return { config, restartRequired }
		},
	}
}
