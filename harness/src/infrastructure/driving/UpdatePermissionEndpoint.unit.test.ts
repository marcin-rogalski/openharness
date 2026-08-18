import { describe, expect, it, vi } from 'vitest'
import type { PermissionUsecasePort } from '@/application/ports/usecases/PermissionUsecasePort'
import UpdatePermissionEndpoint from './UpdatePermissionEndpoint'

describe('UpdatePermissionEndpoint', () => {
	it('exposes the PUT /api/permissions contract', () => {
		const usecase = { update: vi.fn() } as PermissionUsecasePort
		const endpoint = new UpdatePermissionEndpoint(usecase)

		expect(endpoint.toInfo()).toMatchObject({
			method: 'PUT',
			path: '/api/permissions',
		})
	})

	it('validates input and calls the usecase', async () => {
		const permission = {
			id: 'p1',
			name: 'Allow bash',
			resource: 'tool' as const,
			resourceId: 'bash',
			action: 'require_approval' as const,
			scope: 'session' as const,
			scopeId: 's1',
		}
		const usecase = {
			update: vi.fn().mockResolvedValue({ permission }),
		} as PermissionUsecasePort
		const endpoint = new UpdatePermissionEndpoint(usecase)
		const handler = endpoint.createHandler()

		await expect(handler({}, {}, { id: 'p1', permission }, {})).resolves.toEqual({
			permission,
		})
		expect(usecase.update).toHaveBeenCalledWith({ id: 'p1', permission })
	})
})
