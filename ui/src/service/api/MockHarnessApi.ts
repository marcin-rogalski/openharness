import { mockState } from '../mock'
import type { SessionEvent } from '../schema'
import type { HarnessApi, HarnessConfig, UpdateConfigInput } from './HarnessApi'

export function createMockHarnessApi(): HarnessApi {
	let config: HarnessConfig = {
		schemaVersion: 1,
		port: 3000,
		projectsDir: '~/.openharness/projects',
		providers: {
			openai: {
				url: 'https://api.openai.com/v1',
				models: { 'gpt-4o-mini': { label: 'GPT-4o Mini' } },
			},
		},
		defaultModel: 'openai/gpt-4o-mini',
	}
	let sessionId: string | null = null

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

			if (!sessionId) {
				sessionId = crypto.randomUUID()
			}

			const now = new Date().toISOString()
			const events: SessionEvent[] = [
				{
					id: crypto.randomUUID(),
					sessionId: sessionId,
					projectId,
					turnId: null,
					stepId: null,
					timestamp: now,
					actor: 'user',
					type: 'user_message',
					payload: { content: trimmed },
					visibility: 'both',
				},
				{
					id: crypto.randomUUID(),
					sessionId: sessionId,
					projectId,
					turnId: null,
					stepId: null,
					timestamp: now,
					actor: 'agent',
					type: 'model_output_received',
					payload: {
						thinking: `Thinking about: ${trimmed}`,
						toolCalls: [{ tool: 'mock_tool', input: trimmed, output: 'ok' }],
						response: `Mock response to: ${trimmed}`,
					},
					visibility: 'both',
				},
			]

			return { sessionId: sessionId, events }
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
