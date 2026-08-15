import { mockState } from '../mock'
import { createMockTimelineEntries } from '../mockTimeline'
import type { HarnessApi } from './HarnessApi'

export function createMockHarnessApi(): HarnessApi {
	return {
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
	}
}
