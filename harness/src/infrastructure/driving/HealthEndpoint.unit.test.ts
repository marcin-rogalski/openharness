import { describe, expect, it } from 'vitest'
import HealthEndpoint from './HealthEndpoint'

describe('HealthEndpoint', () => {
	it('exposes the GET /api/health contract', () => {
		const endpoint = new HealthEndpoint()

		expect(endpoint.toInfo()).toMatchObject({
			method: 'GET',
			path: '/api/health',
		})
	})

	it('returns ok', async () => {
		const endpoint = new HealthEndpoint()
		const handler = endpoint.createHandler()

		await expect(handler({}, {}, {}, {})).resolves.toEqual({ status: 'ok' })
	})
})
