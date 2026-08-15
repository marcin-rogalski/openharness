import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import Endpoint from './Endpoint'
import { ValidationError } from './types'

describe('Endpoint', () => {
	it('validates params, body, query, headers, and response', async () => {
		const endpoint = new Endpoint(
			'POST',
			'/test',
			{
				params: z.object({ id: z.string() }),
				body: z.object({ value: z.string() }),
				query: z.object({ trace: z.string() }),
				headers: z.object({ authorization: z.string() }),
				response: z.object({ ok: z.boolean() }),
			},
			async (input) => ({ ok: input.id === '1' && input.value === 'x' }),
		)

		const handler = endpoint.createHandler()
		const output = await handler(
			{ id: '1' },
			{ trace: 'abc' },
			{ value: 'x' },
			{ authorization: 'token' },
		)

		expect(output).toEqual({ ok: true })
	})

	it('throws a validation error for invalid params', async () => {
		const endpoint = new Endpoint(
			'GET',
			'/test',
			{ params: z.object({ id: z.string().min(1) }) },
			async () => ({}),
		)

		const handler = endpoint.createHandler()
		await expect(handler({}, {}, {}, {})).rejects.toThrow(ValidationError)
	})

	it('throws a validation error for invalid body', async () => {
		const endpoint = new Endpoint(
			'POST',
			'/test',
			{ body: z.object({ value: z.string() }) },
			async () => ({}),
		)

		const handler = endpoint.createHandler()
		await expect(handler({}, {}, { value: 1 }, {})).rejects.toThrow(
			ValidationError,
		)
	})

	it('throws a validation error for invalid query', async () => {
		const endpoint = new Endpoint(
			'GET',
			'/test',
			{ query: z.object({ value: z.string() }) },
			async () => ({}),
		)

		const handler = endpoint.createHandler()
		await expect(handler({}, { value: 1 }, {}, {})).rejects.toThrow(
			ValidationError,
		)
	})

	it('throws a validation error for invalid headers', async () => {
		const endpoint = new Endpoint(
			'GET',
			'/test',
			{ headers: z.object({ authorization: z.string() }) },
			async () => ({}),
		)

		const handler = endpoint.createHandler()
		await expect(handler({}, {}, {}, { authorization: 1 })).rejects.toThrow(
			ValidationError,
		)
	})

	it('throws a validation error for invalid response', async () => {
		const endpoint = new Endpoint(
			'GET',
			'/test',
			{ response: z.object({ ok: z.boolean() }) },
			async () => ({ ok: 'no' }),
		)

		const handler = endpoint.createHandler()
		await expect(handler({}, {}, {}, {})).rejects.toThrow(ValidationError)
	})

	it('returns handler output when no response schema is provided', async () => {
		const endpoint = new Endpoint('GET', '/test', {}, async () => ({
			ok: true,
		}))

		const handler = endpoint.createHandler()
		await expect(handler({}, {}, {}, {})).resolves.toEqual({ ok: true })
	})
})
