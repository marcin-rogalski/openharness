import http from 'node:http'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
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

		const paramEndpoint = new Endpoint(
			'POST',
			'/projects/:projectId/messages',
			{
				params: z.object({ projectId: z.string().min(1) }),
				body: z.object({ content: z.string().min(1) }),
				query: z.object({ trace: z.string().optional() }),
				response: z.object({
					projectId: z.string(),
					content: z.string(),
					trace: z.string().nullable(),
				}),
			},
			async (input) => ({
				projectId: input.projectId,
				content: input.content,
				trace: input.trace ?? null,
			}),
		)
		server.use(paramEndpoint)

		const invalidJsonEndpoint = new Endpoint(
			'POST',
			'/invalid-json',
			{
				body: z.object({ message: z.string() }),
				response: z.object({ ok: z.boolean() }),
			},
			async () => ({ ok: true }),
		)
		server.use(invalidJsonEndpoint)

		const badResponseEndpoint = new Endpoint(
			'POST',
			'/bad-response',
			{ response: z.object({ ok: z.boolean() }) },
			async () => ({ ok: 'no' }),
		)
		server.use(badResponseEndpoint)

		const errorEndpoint = new Endpoint('POST', '/error', {}, async () => {
			throw new Error('boom')
		})
		server.use(errorEndpoint)

		server.register({
			toInfo: () => ({
				method: 'POST',
				path: '/raw-bad-response',
				schemas: { response: z.object({ ok: z.boolean() }) },
			}),
			createHandler: () => async () => ({ ok: 'no' }),
		})

		server.register({
			toInfo: () => ({
				method: 'POST',
				path: '/string-error',
				schemas: {},
			}),
			createHandler: () => async () => {
				throw 'boom'
			},
		})

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

	it('should pass route params, query, and body to the handler', async () => {
		const response = await fetch(
			`http://localhost:${port}/projects/project-1/messages?trace=abc`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content: 'hello' }),
			},
		)
		const json = await response.json()
		expect(json).toEqual({
			projectId: 'project-1',
			content: 'hello',
			trace: 'abc',
		})
	})

	it('should default missing optional query values', async () => {
		const response = await fetch(
			`http://localhost:${port}/projects/project-1/messages`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content: 'hello' }),
			},
		)
		const json = await response.json()
		expect(json).toEqual({
			projectId: 'project-1',
			content: 'hello',
			trace: null,
		})
	})

	it('should return 400 for invalid JSON body', async () => {
		const response = await fetch(`http://localhost:${port}/invalid-json`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: 'not-json',
		})
		expect(response.status).toBe(400)
		expect(await response.json()).toEqual({ error: 'Invalid JSON body' })
	})

	it('should return 400 when an endpoint validates its own response', async () => {
		const response = await fetch(`http://localhost:${port}/bad-response`, {
			method: 'POST',
		})
		expect(response.status).toBe(400)
		const json = await response.json()
		expect(json.error).toMatch(/^Response validation failed/)
	})

	it('should return 500 when the server validates a raw endpoint response', async () => {
		const response = await fetch(`http://localhost:${port}/raw-bad-response`, {
			method: 'POST',
		})
		expect(response.status).toBe(500)
		const json = await response.json()
		expect(json.error).toBe('Response validation failed')
	})

	it('should return the default error for unhandled errors', async () => {
		const response = await fetch(`http://localhost:${port}/error`, {
			method: 'POST',
		})
		expect(response.status).toBe(500)
		expect(await response.json()).toEqual({ error: 'Internal server error' })
	})

	it('should use a custom error handler when provided', async () => {
		const customServer = new Server({
			port: 0,
			onError: () => ({ status: 599, body: { error: 'custom' } }),
		})
		customServer.use(
			new Endpoint('POST', '/error', {}, async () => {
				throw new Error('boom')
			}),
		)
		const customPort = await customServer.start()

		try {
			const response = await fetch(`http://localhost:${customPort}/error`, {
				method: 'POST',
			})
			expect(response.status).toBe(599)
			expect(await response.json()).toEqual({ error: 'custom' })
		} finally {
			await customServer.stop()
		}
	})

	it('should expose registered endpoints', () => {
		expect(server.endpoints).toHaveLength(7)
	})

	it('should stop cleanly when the server was never started', async () => {
		await new Server({ port: 0 }).stop()
	})

	it('should accept explicit constructor options', async () => {
		const configured = new Server({ port: 0, host: '127.0.0.1' })
		await configured.stop()
	})

	it('should handle an empty body when a body schema is present', async () => {
		const response = await fetch(`http://localhost:${port}/test`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
		})
		expect(response.status).toBe(400)
	})

	it('should treat non-Error thrown values as internal errors', async () => {
		const response = await fetch(`http://localhost:${port}/string-error`, {
			method: 'POST',
		})
		expect(response.status).toBe(500)
		expect(await response.json()).toEqual({ error: 'Internal server error' })
	})

	it('should fall back to the configured port when the address is a string', async () => {
		const addressServer = new Server({ port: 0 })
		const spy = vi
			.spyOn(http.Server.prototype, 'address')
			.mockReturnValue('127.0.0.1:0' as never)

		try {
			expect(await addressServer.start()).toBe(0)
		} finally {
			spy.mockRestore()
			await addressServer.stop()
		}
	})

	it('should fall back to the configured port when the address is null', async () => {
		const addressServer = new Server({ port: 0 })
		const spy = vi
			.spyOn(http.Server.prototype, 'address')
			.mockReturnValue(null as never)

		try {
			expect(await addressServer.start()).toBe(0)
		} finally {
			spy.mockRestore()
			await addressServer.stop()
		}
	})

	it('should handle CORS preflight and response headers', async () => {
		const corsServer = new Server({ port: 0, cors: true })
		corsServer.use(new Endpoint('GET', '/cors', {}, async () => ({ ok: true })))
		const corsPort = await corsServer.start()

		try {
			const preflight = await fetch(`http://localhost:${corsPort}/cors`, {
				method: 'OPTIONS',
				headers: {
					Origin: 'http://example.com',
					'Access-Control-Request-Method': 'GET',
				},
			})
			expect(preflight.status).toBe(204)
			expect(preflight.headers.get('access-control-allow-origin')).toBe('*')
			expect(preflight.headers.get('access-control-allow-methods')).toContain(
				'GET',
			)
			expect(preflight.headers.get('access-control-allow-headers')).toBeNull()

			const requestedPreflight = await fetch(
				`http://localhost:${corsPort}/cors`,
				{
					method: 'OPTIONS',
					headers: {
						Origin: 'http://example.com',
						'Access-Control-Request-Method': 'GET',
						'Access-Control-Request-Headers': 'content-type',
					},
				},
			)
			expect(
				requestedPreflight.headers.get('access-control-allow-headers'),
			).toBe('content-type')

			const response = await fetch(`http://localhost:${corsPort}/cors`, {
				headers: { Origin: 'http://example.com' },
			})
			expect(response.status).toBe(200)
			expect(response.headers.get('access-control-allow-origin')).toBe('*')
		} finally {
			await corsServer.stop()
		}
	})

	it('should restrict CORS origins and credentials', async () => {
		const corsServer = new Server({
			port: 0,
			cors: {
				allowedOrigins: ['http://example.com'],
				allowedHeaders: ['x-custom'],
				allowCredentials: true,
			},
		})
		corsServer.use(new Endpoint('GET', '/cors', {}, async () => ({ ok: true })))
		const corsPort = await corsServer.start()

		try {
			const preflight = await fetch(`http://localhost:${corsPort}/cors`, {
				method: 'OPTIONS',
				headers: {
					Origin: 'http://example.com',
					'Access-Control-Request-Method': 'GET',
					'Access-Control-Request-Headers': 'x-custom, x-other',
				},
			})
			expect(preflight.headers.get('access-control-allow-origin')).toBe(
				'http://example.com',
			)
			expect(preflight.headers.get('access-control-allow-credentials')).toBe(
				'true',
			)
			expect(preflight.headers.get('access-control-allow-headers')).toBe(
				'x-custom',
			)

			const response = await fetch(`http://localhost:${corsPort}/cors`, {
				headers: { Origin: 'http://evil.example' },
			})
			expect(response.headers.get('access-control-allow-origin')).toBeNull()
		} finally {
			await corsServer.stop()
		}
	})

	it('should omit CORS headers when CORS is disabled', async () => {
		const plainServer = new Server({ port: 0 })
		plainServer.use(
			new Endpoint('GET', '/plain', {}, async () => ({ ok: true })),
		)
		const plainPort = await plainServer.start()

		try {
			const response = await fetch(`http://localhost:${plainPort}/plain`, {
				headers: { Origin: 'http://example.com' },
			})
			expect(response.status).toBe(200)
			expect(response.headers.get('access-control-allow-origin')).toBeNull()
		} finally {
			await plainServer.stop()
		}
	})

	it('should echo the origin when wildcard CORS allows credentials', async () => {
		const corsServer = new Server({
			port: 0,
			cors: { allowedOrigins: ['*'], allowCredentials: true },
		})
		corsServer.use(new Endpoint('GET', '/cors', {}, async () => ({ ok: true })))
		const corsPort = await corsServer.start()

		try {
			const response = await fetch(`http://localhost:${corsPort}/cors`, {
				headers: { Origin: 'http://example.com' },
			})
			expect(response.headers.get('access-control-allow-origin')).toBe(
				'http://example.com',
			)
			expect(response.headers.get('access-control-allow-credentials')).toBe(
				'true',
			)
		} finally {
			await corsServer.stop()
		}
	})
})
