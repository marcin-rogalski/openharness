import { describe, expect, it, vi } from 'vitest'
import OpenAiAgentRuntimeAdapter from './OpenAiAgentRuntimeAdapter'

function createFetchMock(responseBody: unknown, ok = true, status = 200) {
	return vi.fn().mockResolvedValue({
		ok,
		status,
		json: async () => responseBody,
		text: async () => JSON.stringify(responseBody),
	})
}

describe('OpenAiAgentRuntimeAdapter', () => {
	it('sends the correct request to the OpenAI API', async () => {
		const fetchMock = createFetchMock({
			choices: [{ message: { role: 'assistant', content: 'Hello!' } }],
		})
		vi.stubGlobal('fetch', fetchMock)

		const adapter = new OpenAiAgentRuntimeAdapter('test-key', 'gpt-4o-mini')
		await adapter.handle({
			sessionId: 'session-1',
			projectId: 'project-1',
			context: [
				{ role: 'system', content: 'You are helpful.' },
				{ role: 'user', content: 'Hi' },
			],
		})

		expect(fetchMock).toHaveBeenCalledWith(
			'https://api.openai.com/v1/chat/completions',
			expect.objectContaining({
				method: 'POST',
				headers: expect.objectContaining({
					Authorization: 'Bearer test-key',
					'Content-Type': 'application/json',
				}),
			}),
		)

		const body = JSON.parse(fetchMock.mock.calls[0][1].body)
		expect(body.model).toBe('gpt-4o-mini')
		expect(body.messages).toEqual([
			{ role: 'system', content: 'You are helpful.' },
			{ role: 'user', content: 'Hi' },
		])
	})

	it('parses the response content', async () => {
		const fetchMock = createFetchMock({
			choices: [{ message: { role: 'assistant', content: 'Hello there' } }],
		})
		vi.stubGlobal('fetch', fetchMock)

		const adapter = new OpenAiAgentRuntimeAdapter('key', 'gpt-4o-mini')
		const result = await adapter.handle({
			sessionId: 's',
			projectId: 'p',
			context: [{ role: 'user', content: 'Hi' }],
		})

		expect(result.response).toBe('Hello there')
		expect(result.thinking).toBeNull()
		expect(result.toolCalls).toEqual([])
	})

	it('parses tool calls from the response', async () => {
		const fetchMock = createFetchMock({
			choices: [
				{
					message: {
						role: 'assistant',
						content: null,
						tool_calls: [
							{
								id: 'call-1',
								function: { name: 'get_weather', arguments: '{"city":"NYC"}' },
							},
						],
					},
				},
			],
		})
		vi.stubGlobal('fetch', fetchMock)

		const adapter = new OpenAiAgentRuntimeAdapter('key', 'gpt-4o-mini')
		const result = await adapter.handle({
			sessionId: 's',
			projectId: 'p',
			context: [{ role: 'user', content: 'Weather in NYC?' }],
		})

		expect(result.toolCalls).toEqual([
			{ tool: 'get_weather', input: '{"city":"NYC"}', output: '' },
		])
		expect(result.response).toBe('')
	})

	it('uses a custom base URL', async () => {
		const fetchMock = createFetchMock({
			choices: [{ message: { role: 'assistant', content: 'ok' } }],
		})
		vi.stubGlobal('fetch', fetchMock)

		const adapter = new OpenAiAgentRuntimeAdapter(
			'key',
			'gpt-4o-mini',
			'http://localhost:11434/v1',
		)
		await adapter.handle({
			sessionId: 's',
			projectId: 'p',
			context: [{ role: 'user', content: 'Hi' }],
		})

		expect(fetchMock).toHaveBeenCalledWith(
			'http://localhost:11434/v1/chat/completions',
			expect.anything(),
		)
	})

	it('throws on API error', async () => {
		const fetchMock = createFetchMock(
			{ error: { message: 'Rate limit exceeded' } },
			false,
			429,
		)
		vi.stubGlobal('fetch', fetchMock)

		const adapter = new OpenAiAgentRuntimeAdapter('key', 'gpt-4o-mini')
		await expect(
			adapter.handle({
				sessionId: 's',
				projectId: 'p',
				context: [{ role: 'user', content: 'Hi' }],
			}),
		).rejects.toThrow('OpenAI API error 429')
	})

	it('throws when no choices are returned', async () => {
		const fetchMock = createFetchMock({ choices: [] })
		vi.stubGlobal('fetch', fetchMock)

		const adapter = new OpenAiAgentRuntimeAdapter('key', 'gpt-4o-mini')
		await expect(
			adapter.handle({
				sessionId: 's',
				projectId: 'p',
				context: [{ role: 'user', content: 'Hi' }],
			}),
		).rejects.toThrow('no choices')
	})
})
