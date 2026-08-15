import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { z } from 'zod'
import Endpoint from '../src/Endpoint'
import Server from '../src/Server'

describe('Server', () => {
	let server: Server
	let port: number

	beforeAll(async () => {
		server = new Server({ port: 0 })
		const endpoint = new Endpoint(
			'POST',
			'/test',
			{
				body: z.object({ message: z.string() }),
				response: z.object({ received: z.string(), timestamp: z.number() }),
			},
			async (input) => ({ received: input.message, timestamp: Date.now() }),
		)
		server.use(endpoint)
		port = await server.start()
	})

	afterAll(async () => {
		await server.stop()
	})

	it('should handle a POST request', async () => {
		const response = await fetch(`http://localhost:${port}/test`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ message: 'hello' }),
		})
		const json = await response.json()
		expect(json).toEqual({
			received: 'hello',
			timestamp: expect.any(Number),
		})
	})

	it('should return 400 for invalid body', async () => {
		const response = await fetch(`http://localhost:${port}/test`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ invalid: true }),
		})
		expect(response.status).toBe(400)
	})

	it('should return 404 for unknown route', async () => {
		const response = await fetch(`http://localhost:${port}/unknown`)
		expect(response.status).toBe(404)
	})
})
