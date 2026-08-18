import { describe, expect, it, vi } from 'vitest'
import type { AgentUsecasePort } from '@/application/ports/usecases/AgentUsecasePort'
import ListAgentsEndpoint from './ListAgentsEndpoint'

describe('ListAgentsEndpoint', () => {
	it('exposes the GET /api/agents contract', () => {
		const usecase = { list: vi.fn() } as AgentUsecasePort
		const endpoint = new ListAgentsEndpoint(usecase)

		expect(endpoint.toInfo()).toMatchObject({
			method: 'GET',
			path: '/api/agents',
		})
	})

	it('calls the usecase and returns agents', async () => {
		const agents = [
			{
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
			},
		]
		const usecase = {
			list: vi.fn().mockResolvedValue({ agents }),
		} as AgentUsecasePort
		const endpoint = new ListAgentsEndpoint(usecase)
		const handler = endpoint.createHandler()

		await expect(handler({}, {}, {}, {})).resolves.toEqual({ agents })
		expect(usecase.list).toHaveBeenCalledOnce()
	})
})
