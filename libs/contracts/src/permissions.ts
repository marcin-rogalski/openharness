import type { EndpointSchema } from '@openharness/fetch'
import { z } from 'zod'

export const PermissionSchema = z.object({
	id: z.string(),
	name: z.string(),
	resource: z.enum(['tool', 'sandbox', 'mcp_server']),
	resourceId: z.string(),
	action: z.enum(['allow', 'deny', 'require_approval']),
	scope: z.enum(['project', 'agent', 'session']),
	scopeId: z.string().nullable(),
})

export const ListPermissionsResponseSchema = z.object({
	permissions: z.array(PermissionSchema),
})

export const CreatePermissionRequestSchema = z.object({
	permission: PermissionSchema,
})

export const CreatePermissionResponseSchema = z.object({
	permission: PermissionSchema,
})

export const UpdatePermissionRequestSchema = z.object({
	id: z.string(),
	permission: PermissionSchema,
})

export const UpdatePermissionResponseSchema = z.object({
	permission: PermissionSchema,
})

export const listPermissionsEndpoint = {
	method: 'GET' as const,
	path: '/api/permissions',
	response: ListPermissionsResponseSchema,
} satisfies EndpointSchema

export const createPermissionEndpoint = {
	method: 'POST' as const,
	path: '/api/permissions',
	body: CreatePermissionRequestSchema,
	response: CreatePermissionResponseSchema,
} satisfies EndpointSchema

export const updatePermissionEndpoint = {
	method: 'PUT' as const,
	path: '/api/permissions',
	body: UpdatePermissionRequestSchema,
	response: UpdatePermissionResponseSchema,
} satisfies EndpointSchema
