import type { EndpointSchema } from '@openharness/fetch'
import { z } from 'zod'
import { BudgetSchema } from './agents'

export const ListBudgetsResponseSchema = z.object({
	budgets: z.array(BudgetSchema),
})

export const CreateBudgetRequestSchema = z.object({
	budget: BudgetSchema,
})

export const CreateBudgetResponseSchema = z.object({
	budget: BudgetSchema,
})

export const UpdateBudgetRequestSchema = z.object({
	id: z.string(),
	budget: BudgetSchema,
})

export const UpdateBudgetResponseSchema = z.object({
	budget: BudgetSchema,
})

export const listBudgetsEndpoint = {
	method: 'GET' as const,
	path: '/api/budgets',
	response: ListBudgetsResponseSchema,
} satisfies EndpointSchema

export const createBudgetEndpoint = {
	method: 'POST' as const,
	path: '/api/budgets',
	body: CreateBudgetRequestSchema,
	response: CreateBudgetResponseSchema,
} satisfies EndpointSchema

export const updateBudgetEndpoint = {
	method: 'PUT' as const,
	path: '/api/budgets',
	body: UpdateBudgetRequestSchema,
	response: UpdateBudgetResponseSchema,
} satisfies EndpointSchema
