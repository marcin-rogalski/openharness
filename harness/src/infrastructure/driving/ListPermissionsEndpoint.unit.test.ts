import { describe, expect, it, vi } from 'vitest'
import type { PermissionUsecasePort } from '@/application/ports/usecases/PermissionUsecasePort'
import ListPermissionsEndpoint from './ListPermissionsEndpoint'

describe('ListPermissionsEndpoint', () => {
	it('exposes the GET /api/permissions contract', () => {
		const usecase = { list: vi.fn() } as PermissionUsecasePort
		const endpoint = new ListPermissionsEndpoint(usecase)

		expect(endpoint.toInfo()).toMatchObject({
			method: 'GET',
			path: '/api/permissions',
		})
	})

	it('calls the usecase and returns permissions', async () => {
		const permissions = [
			{
				id: 'p1',
				name: 'Allow bash',
				resource: 'tool' as const,
				resourceId: 'bash',
				action: 'allow' as const,
				scope: 'project' as const,
				scopeId: null,
			},
		]
		const usecase = {
			list: vi.fn().mockResolvedValue({ permissions }),
		} as PermissionUsecasePort
		const endpoint = new ListPermissionsEndpoint(usecase)
		const handler = endpoint.createHandler()

		await expect(handler({}, {}, {}, {})).resolves.toEqual({ permissions })
		expect(usecase.list).toHaveBeenCalledOnce()
	})
})
