import type { EndpointSchema } from '@openharness/fetch'
import { z } from 'zod'

export const BudgetSchema = z.object({
	id: z.string(),
	name: z.string(),
	tokenLimitPerTurn: z.number().nullable(),
	tokenLimitPerSession: z.number().nullable(),
	costLimitPerTurn: z.number().nullable(),
	costLimitPerSession: z.number().nullable(),
	enforcementPoint: z.enum(['pre_request', 'post_response']),
})

export const AgentSchema = z.object({
	id: z.string(),
	name: z.string(),
	role: z.string(),
	description: z.string(),
	tools: z.array(z.string()),
	mcpAccess: z.array(z.string()),
	memoryAccess: z.boolean(),
	sandboxPolicy: z.object({
		level: z.enum(['none', 'read-only', 'workspace-write', 'full']),
		workspaceRoot: z.string(),
	}),
	budget: BudgetSchema,
	modelPreferences: z.object({
		provider: z.string(),
		model: z.string(),
	}),
})

export const ListAgentsResponseSchema = z.object({
	agents: z.array(AgentSchema),
})

export const CreateAgentRequestSchema = z.object({
	agent: AgentSchema,
})

export const CreateAgentResponseSchema = z.object({
	agent: AgentSchema,
})

export const UpdateAgentRequestSchema = z.object({
	id: z.string(),
	agent: AgentSchema,
})

export const UpdateAgentResponseSchema = z.object({
	agent: AgentSchema,
})

export const listAgentsEndpoint = {
	method: 'GET' as const,
	path: '/api/agents',
	response: ListAgentsResponseSchema,
} satisfies EndpointSchema

export const createAgentEndpoint = {
	method: 'POST' as const,
	path: '/api/agents',
	body: CreateAgentRequestSchema,
	response: CreateAgentResponseSchema,
} satisfies EndpointSchema

export const updateAgentEndpoint = {
	method: 'PUT' as const,
	path: '/api/agents',
	body: UpdateAgentRequestSchema,
	response: UpdateAgentResponseSchema,
} satisfies EndpointSchema
