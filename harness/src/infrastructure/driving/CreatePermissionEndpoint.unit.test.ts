import { describe, expect, it, vi } from 'vitest'
import type { PermissionUsecasePort } from '@/application/ports/usecases/PermissionUsecasePort'
import CreatePermissionEndpoint from './CreatePermissionEndpoint'

describe('CreatePermissionEndpoint', () => {
	it('exposes the POST /api/permissions contract', () => {
		const usecase = { create: vi.fn() } as PermissionUsecasePort
		const endpoint = new CreatePermissionEndpoint(usecase)

		expect(endpoint.toInfo()).toMatchObject({
			method: 'POST',
			path: '/api/permissions',
		})
	})

	it('validates input and calls the usecase', async () => {
		const permission = {
			id: 'p1',
			name: 'Allow bash',
			resource: 'tool' as const,
			resourceId: 'bash',
			action: 'allow' as const,
			scope: 'project' as const,
			scopeId: null,
		}
		const usecase = {
			create: vi.fn().mockResolvedValue({ permission }),
		} as PermissionUsecasePort
		const endpoint = new CreatePermissionEndpoint(usecase)
		const handler = endpoint.createHandler()

		await expect(handler({}, {}, { permission }, {})).resolves.toEqual({
			permission,
		})
		expect(usecase.create).toHaveBeenCalledWith({ permission })
	})
})
