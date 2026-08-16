import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { FetchApiError } from './FetchApiError'
import { FetchClient } from './FetchClient'
import type { ApiSchema } from './types'

function jsonResponse(status: number, body: unknown) {
	return {
		ok: status >= 200 && status < 300,
		status,
		json: async () => body,
	} as unknown as Response
}

const api = {
	health: {
		method: 'GET' as const,
		path: '/api/health',
		response: z.object({ status: z.literal('ok') }),
	},
	listProjects: {
		method: 'GET' as const,
		path: '/api/projects',
		query: z.object({ limit: z.number().optional() }),
		response: z.object({ projects: z.array(z.string()) }),
	},
	search: {
		method: 'GET' as const,
		path: '/search',
		query: z.object({
			tag: z.array(z.string()).optional(),
			skip: z.string().nullable().optional(),
			limit: z.number().optional(),
		}),
		response: z.unknown(),
	},
	sendMessage: {
		method: 'POST' as const,
		path: '/api/projects/:projectId/messages',
		params: z.object({ projectId: z.string() }),
		body: z.object({ content: z.string() }),
		response: z.object({ entries: z.array(z.string()) }),
	},
	getItem: {
		method: 'GET' as const,
		path: '/items/:itemId',
		params: z.object({ itemId: z.string().optional() }),
		response: z.unknown(),
	},
	raw: {
		method: 'GET' as const,
		path: '/raw',
	},
} satisfies ApiSchema

describe('FetchClient', () => {
	it('uses the injected fetch implementation and parses the response schema', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(jsonResponse(200, { status: 'ok' }))
		const client = new FetchClient(api, {
			baseUrl: 'http://harness/',
			fetch: fetchMock,
		})

		await expect(client.request('health')).resolves.toEqual({ status: 'ok' })

		expect(fetchMock).toHaveBeenCalledWith(
			'http://harness/api/health',
			expect.objectContaining({
				method: 'GET',
				headers: expect.objectContaining({
					'Content-Type': 'application/json',
				}),
			}),
		)
	})

	it('uses global fetch when no fetch implementation is injected', async () => {
		const globalFetch = vi
			.fn()
			.mockResolvedValue(jsonResponse(200, { status: 'ok' }))
		vi.stubGlobal('fetch', globalFetch)
		const client = new FetchClient(api)

		await expect(client.request('health')).resolves.toEqual({ status: 'ok' })

		expect(globalFetch).toHaveBeenCalledWith(
			'/api/health',
			expect.objectContaining({ method: 'GET' }),
		)
		vi.unstubAllGlobals()
	})

	it('calls the default global fetch with the global object as this', async () => {
		const globalFetch = vi.fn(async function (this: unknown) {
			expect(this).toBe(globalThis)
			return jsonResponse(200, { status: 'ok' })
		})
		vi.stubGlobal('fetch', globalFetch)
		const client = new FetchClient(api)

		await expect(client.request('health')).resolves.toEqual({ status: 'ok' })

		expect(globalFetch).toHaveBeenCalledOnce()
		vi.unstubAllGlobals()
	})

	it('serializes query parameters into the request URL', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(jsonResponse(200, { projects: ['project-1'] }))
		const client = new FetchClient(api, {
			baseUrl: 'http://harness',
			fetch: fetchMock,
		})

		await expect(
			client.request('listProjects', { query: { limit: 5 } }),
		).resolves.toEqual({ projects: ['project-1'] })

		expect(fetchMock).toHaveBeenCalledWith(
			'http://harness/api/projects?limit=5',
			expect.objectContaining({ method: 'GET' }),
		)
	})

	it('omits null and undefined query values and repeats array values', async () => {
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, null))
		const client = new FetchClient(api, { fetch: fetchMock })

		await client.request('search', {
			query: { tag: ['a', 'b'], skip: null, limit: 3 },
		})

		expect(fetchMock).toHaveBeenCalledWith(
			'/search?tag=a&tag=b&limit=3',
			expect.objectContaining({ method: 'GET' }),
		)
	})

	it('encodes path parameters and sends a JSON body', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(jsonResponse(200, { entries: ['entry-1'] }))
		const client = new FetchClient(api, { fetch: fetchMock })

		await expect(
			client.request('sendMessage', {
				params: { projectId: 'project 1' },
				body: { content: 'Hello' },
			}),
		).resolves.toEqual({ entries: ['entry-1'] })

		expect(fetchMock).toHaveBeenCalledWith(
			'/api/projects/project%201/messages',
			expect.objectContaining({
				method: 'POST',
				body: JSON.stringify({ content: 'Hello' }),
			}),
		)
	})

	it('rejects when body validation fails', async () => {
		const fetchMock = vi.fn()
		const client = new FetchClient(api, { fetch: fetchMock })

		await expect(
			client.request('sendMessage', {
				params: { projectId: 'project-1' },
				body: { content: 123 } as never,
			}),
		).rejects.toThrow()

		expect(fetchMock).not.toHaveBeenCalled()
	})

	it('rejects when response validation fails', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(jsonResponse(200, { status: 'nope' }))
		const client = new FetchClient(api, { fetch: fetchMock })

		await expect(client.request('health')).rejects.toThrow()
	})

	it('throws FetchApiError with the server error message', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(jsonResponse(500, { error: 'boom' }))
		const client = new FetchClient(api, { fetch: fetchMock })

		try {
			await client.request('health')
			expect.unreachable()
		} catch (error) {
			expect(error).toBeInstanceOf(FetchApiError)
			expect((error as FetchApiError).status).toBe(500)
			expect((error as FetchApiError).message).toBe('boom')
		}
	})

	it('falls back to a status message when the error payload has no message', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(jsonResponse(503, { message: 'nope' }))
		const client = new FetchClient(api, { fetch: fetchMock })

		await expect(client.request('health')).rejects.toThrow(
			'Request failed with status 503',
		)
	})

	it('falls back to a status message when the error payload is not JSON', async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: false,
			status: 500,
			json: async () => {
				throw new Error('invalid JSON')
			},
		} as unknown as Response)
		const client = new FetchClient(api, { fetch: fetchMock })

		await expect(client.request('health')).rejects.toThrow(
			'Request failed with status 500',
		)
	})

	it('returns the payload when the endpoint has no response schema', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(jsonResponse(200, { anything: true }))
		const client = new FetchClient(api, { fetch: fetchMock })

		await expect(client.request('raw')).resolves.toEqual({ anything: true })
	})

	it('returns undefined when a schemaless endpoint has no JSON body', async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			status: 204,
			json: async () => {
				throw new Error('no content')
			},
		} as unknown as Response)
		const client = new FetchClient(api, { fetch: fetchMock })

		await expect(client.request('raw')).resolves.toBeUndefined()
	})

	it('merges custom headers with the default JSON header', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(jsonResponse(200, { status: 'ok' }))
		const client = new FetchClient(api, {
			fetch: fetchMock,
			headers: { 'X-Test': '1' },
		})

		await client.request('health')

		expect(fetchMock).toHaveBeenCalledWith(
			'/api/health',
			expect.objectContaining({
				headers: expect.objectContaining({
					'Content-Type': 'application/json',
					'X-Test': '1',
				}),
			}),
		)
	})

	it('rejects when a required path parameter is missing at runtime', async () => {
		const fetchMock = vi.fn()
		const client = new FetchClient(api, { fetch: fetchMock })

		await expect(client.request('getItem')).rejects.toThrow(
			'Missing path parameter: itemId',
		)

		expect(fetchMock).not.toHaveBeenCalled()
	})
})
