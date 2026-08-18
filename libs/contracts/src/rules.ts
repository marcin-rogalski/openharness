import type { EndpointSchema } from '@openharness/fetch'
import { z } from 'zod'

export const RuleSchema = z.object({
	id: z.string(),
	name: z.string(),
	when: z.enum([
		'tool_call',
		'turn_start',
		'turn_end',
		'step_start',
		'step_end',
		'session_start',
		'session_end',
	]),
	condition: z.record(z.string(), z.unknown()),
	action: z.enum(['allow', 'deny', 'require_approval', 'annotate']),
	guard: z.string().nullable(),
})

export const ListRulesResponseSchema = z.object({
	rules: z.array(RuleSchema),
})

export const CreateRuleRequestSchema = z.object({
	rule: RuleSchema,
})

export const CreateRuleResponseSchema = z.object({
	rule: RuleSchema,
})

export const UpdateRuleRequestSchema = z.object({
	id: z.string(),
	rule: RuleSchema,
})

export const UpdateRuleResponseSchema = z.object({
	rule: RuleSchema,
})

export const listRulesEndpoint = {
	method: 'GET' as const,
	path: '/api/rules',
	response: ListRulesResponseSchema,
} satisfies EndpointSchema

export const createRuleEndpoint = {
	method: 'POST' as const,
	path: '/api/rules',
	body: CreateRuleRequestSchema,
	response: CreateRuleResponseSchema,
} satisfies EndpointSchema

export const updateRuleEndpoint = {
	method: 'PUT' as const,
	path: '/api/rules',
	body: UpdateRuleRequestSchema,
	response: UpdateRuleResponseSchema,
} satisfies EndpointSchema
