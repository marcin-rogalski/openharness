import SendProjectMessageEndpoint from '@/infrastructure/driving/SendProjectMessageEndpoint'
import { describe, expect, it } from 'vitest'
import composeDriven from './composedDriven'
import composeDriving from './composedDriving'
import composeUsecases from './composedUsecases'

describe('composeDriving', () => {
	it('builds the send project message endpoint', async () => {
		const endpoints = composeDriving(composeUsecases(await composeDriven()))

		expect(endpoints).toHaveLength(1)
		expect(endpoints[0]).toBeInstanceOf(SendProjectMessageEndpoint)
		expect(endpoints[0].toInfo()).toMatchObject({
			method: 'POST',
			path: '/api/projects/:projectId/messages',
		})
	})
})
