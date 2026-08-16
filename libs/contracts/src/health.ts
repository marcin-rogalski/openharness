import type { EndpointSchema } from '@openharness/fetch'
import { z } from 'zod'

export const HealthResponseSchema = z.object({
	status: z.literal('ok'),
})

export const healthEndpoint = {
	method: 'GET' as const,
	path: '/api/health',
	response: HealthResponseSchema,
} satisfies EndpointSchema
