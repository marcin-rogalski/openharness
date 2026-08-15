import ListProjectsEndpoint from '@/infrastructure/driving/ListProjectsEndpoint'
import SendProjectMessageEndpoint from '@/infrastructure/driving/SendProjectMessageEndpoint'
import { describe, expect, it } from 'vitest'
import composeDriven from './composedDriven'
import composeDriving from './composedDriving'
import composeUsecases from './composedUsecases'

describe('composeDriving', () => {
	it('builds the list projects endpoint', async () => {
		const endpoints = composeDriving(composeUsecases(await composeDriven()))

		expect(endpoints[0]).toBeInstanceOf(ListProjectsEndpoint)
		expect(endpoints[0].toInfo()).toMatchObject({
			method: 'GET',
			path: '/api/projects',
		})
	})

	it('builds the send project message endpoint', async () => {
		const endpoints = composeDriving(composeUsecases(await composeDriven()))

		expect(endpoints).toHaveLength(2)
		expect(endpoints[1]).toBeInstanceOf(SendProjectMessageEndpoint)
		expect(endpoints[1].toInfo()).toMatchObject({
			method: 'POST',
			path: '/api/projects/:projectId/messages',
		})
	})
})
