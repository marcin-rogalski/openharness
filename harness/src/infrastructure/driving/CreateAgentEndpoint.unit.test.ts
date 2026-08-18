import { describe, expect, it, vi } from 'vitest'
import type { AgentUsecasePort } from '@/application/ports/usecases/AgentUsecasePort'
import CreateAgentEndpoint from './CreateAgentEndpoint'

describe('CreateAgentEndpoint', () => {
	it('exposes the POST /api/agents contract', () => {
		const usecase = { create: vi.fn() } as AgentUsecasePort
		const endpoint = new CreateAgentEndpoint(usecase)

		expect(endpoint.toInfo()).toMatchObject({
			method: 'POST',
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
				tokenLimitPerTurn: 1000,
				tokenLimitPerSession: 10000,
				costLimitPerTurn: null,
				costLimitPerSession: null,
				enforcementPoint: 'pre_request' as const,
			},
			modelPreferences: { provider: 'openai', model: 'gpt-4o-mini' },
		}
		const usecase = {
			create: vi.fn().mockResolvedValue({ agent }),
		} as AgentUsecasePort
		const endpoint = new CreateAgentEndpoint(usecase)
		const handler = endpoint.createHandler()

		await expect(handler({}, {}, { agent }, {})).resolves.toEqual({ agent })
		expect(usecase.create).toHaveBeenCalledWith({ agent })
	})
})
