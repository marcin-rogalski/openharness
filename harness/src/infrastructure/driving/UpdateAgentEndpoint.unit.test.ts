import { describe, expect, it, vi } from 'vitest'
import type { AgentUsecasePort } from '@/application/ports/usecases/AgentUsecasePort'
import UpdateAgentEndpoint from './UpdateAgentEndpoint'

describe('UpdateAgentEndpoint', () => {
	it('exposes the PUT /api/agents contract', () => {
		const usecase = { update: vi.fn() } as AgentUsecasePort
		const endpoint = new UpdateAgentEndpoint(usecase)

		expect(endpoint.toInfo()).toMatchObject({
			method: 'PUT',
			path: '/api/agents',
		})
	})

	it('validates input and calls the usecase', async () => {
		const agent = {
			id: 'a1',
			name: 'Coder',
			role: 'developer',
			description: 'Writes code',
			tools: ['read', 'write'],
			mcpAccess: [],
			memoryAccess: true,
			sandboxPolicy: { level: 'workspace-write' as const, workspaceRoot: '/tmp' },
			budget: {
				id: 'b1',
				name: 'Default',
				tokenLimitPerTurn: 2000,
				tokenLimitPerSession: 20000,
				costLimitPerTurn: null,
				costLimitPerSession: null,
				enforcementPoint: 'pre_request' as const,
			},
			modelPreferences: { provider: 'openai', model: 'gpt-4o-mini' },
		}
		const usecase = {
			update: vi.fn().mockResolvedValue({ agent }),
		} as AgentUsecasePort
		const endpoint = new UpdateAgentEndpoint(usecase)
		const handler = endpoint.createHandler()

		await expect(handler({}, {}, { id: 'a1', agent }, {})).resolves.toEqual({ agent })
		expect(usecase.update).toHaveBeenCalledWith({ id: 'a1', agent })
	})
})
