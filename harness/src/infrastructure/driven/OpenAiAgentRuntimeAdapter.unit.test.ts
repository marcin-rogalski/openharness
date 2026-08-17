import { describe, expect, it, vi } from 'vitest'
import OpenAiAgentRuntimeAdapter from './OpenAiAgentRuntimeAdapter'
import type { AgentRuntimeRequest } from '@/application/ports/adapters/AgentRuntimePort'

function createFetchMock(responseBody: unknown, ok = true, status = 200) {
	return vi.fn().mockResolvedValue({
		ok,
		status,
		json: async () => responseBody,
		text: async () => JSON.stringify(responseBody),
	})
}

function createRequest(overrides?: Partial<AgentRuntimeRequest>): AgentRuntimeRequest {
	return {
		sessionId: 'session-1',
		projectId: 'project-1',
		turnId: 'turn-1',
		step: 0,
		context: [{ role: 'user', content: 'Hi' }],
		tools: [],
		...overrides,
	}
}

describe('OpenAiAgentRuntimeAdapter', () => {
	it('sends the correct request to the OpenAI API', async () => {
		const fetchMock = createFetchMock({
			choices: [
				{
					message: { role: 'assistant', content: 'Hello!' },
					finish_reason: 'stop',
				},
			],
			usage: { prompt_tokens: 10, completion_tokens: 5 },
		})
		vi.stubGlobal('fetch', fetchMock)

		const adapter = new OpenAiAgentRuntimeAdapter('test-key', 'gpt-4o-mini')
		await adapter.handle(
			createRequest({
				context: [
					{ role: 'system', content: 'You are helpful.' },
					{ role: 'user', content: 'Hi' },
				],
			}),
		)

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
		expect(body.tools).toBeUndefined()
	})

	it('sends tools in the request body when provided', async () => {
		const fetchMock = createFetchMock({
			choices: [
				{
					message: { role: 'assistant', content: 'ok' },
					finish_reason: 'stop',
				},
			],
		})
		vi.stubGlobal('fetch', fetchMock)

		const adapter = new OpenAiAgentRuntimeAdapter('key', 'gpt-4o-mini')
		await adapter.handle(
			createRequest({
				tools: [
					{
						id: 'tool-1',
						name: 'get_weather',
						description: 'Get weather',
						inputSchema: { type: 'object' },
						sandboxLevel: 'none',
					},
				],
			}),
		)

		const body = JSON.parse(fetchMock.mock.calls[0][1].body)
		expect(body.tools).toEqual([
			{
				type: 'function',
				function: {
					name: 'get_weather',
					description: 'Get weather',
					parameters: { type: 'object' },
				},
			},
		])
	})

	it('maps tool role messages in context', async () => {
		const fetchMock = createFetchMock({
			choices: [
				{
					message: { role: 'assistant', content: 'ok' },
					finish_reason: 'stop',
				},
			],
		})
		vi.stubGlobal('fetch', fetchMock)

		const adapter = new OpenAiAgentRuntimeAdapter('key', 'gpt-4o-mini')
		await adapter.handle(
			createRequest({
				context: [
					{ role: 'user', content: 'Weather?' },
					{
						role: 'assistant',
						content: '',
						toolCalls: [
							{ id: 'call-1', tool: 'get_weather', input: '{"city":"NYC"}' },
						],
					},
					{ role: 'tool', toolCallId: 'call-1', content: 'Sunny' },
				],
			}),
		)

		const body = JSON.parse(fetchMock.mock.calls[0][1].body)
		expect(body.messages).toEqual([
			{ role: 'user', content: 'Weather?' },
			{
				role: 'assistant',
				content: null,
				tool_calls: [
					{
						id: 'call-1',
						type: 'function',
						function: { name: 'get_weather', arguments: '{"city":"NYC"}' },
					},
				],
			},
			{ role: 'tool', tool_call_id: 'call-1', content: 'Sunny' },
		])
	})

	it('parses the response content with finishReason and usage', async () => {
		const fetchMock = createFetchMock({
			choices: [
				{
					message: { role: 'assistant', content: 'Hello there' },
					finish_reason: 'stop',
				},
			],
			usage: { prompt_tokens: 42, completion_tokens: 7 },
		})
		vi.stubGlobal('fetch', fetchMock)

		const adapter = new OpenAiAgentRuntimeAdapter('key', 'gpt-4o-mini')
		const result = await adapter.handle(createRequest())

		expect(result.response).toBe('Hello there')
		expect(result.thinking).toBeNull()
		expect(result.toolCalls).toEqual([])
		expect(result.finishReason).toBe('stop')
		expect(result.usage).toEqual({ inputTokens: 42, outputTokens: 7 })
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
					finish_reason: 'tool_calls',
				},
			],
			usage: { prompt_tokens: 10, completion_tokens: 5 },
		})
		vi.stubGlobal('fetch', fetchMock)

		const adapter = new OpenAiAgentRuntimeAdapter('key', 'gpt-4o-mini')
		const result = await adapter.handle(
			createRequest({
				context: [{ role: 'user', content: 'Weather in NYC?' }],
			}),
		)

		expect(result.toolCalls).toEqual([
			{ id: 'call-1', tool: 'get_weather', input: '{"city":"NYC"}' },
		])
		expect(result.response).toBe('')
		expect(result.finishReason).toBe('tool_calls')
	})

	it('maps finish_reason length to max_tokens', async () => {
		const fetchMock = createFetchMock({
			choices: [
				{
					message: { role: 'assistant', content: 'truncated' },
					finish_reason: 'length',
				},
			],
		})
		vi.stubGlobal('fetch', fetchMock)

		const adapter = new OpenAiAgentRuntimeAdapter('key', 'gpt-4o-mini')
		const result = await adapter.handle(createRequest())

		expect(result.finishReason).toBe('max_tokens')
	})

	it('uses a custom base URL', async () => {
		const fetchMock = createFetchMock({
			choices: [
				{
					message: { role: 'assistant', content: 'ok' },
					finish_reason: 'stop',
				},
			],
		})
		vi.stubGlobal('fetch', fetchMock)

		const adapter = new OpenAiAgentRuntimeAdapter(
			'key',
			'gpt-4o-mini',
			'http://localhost:11434/v1',
		)
		await adapter.handle(createRequest())

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
		await expect(adapter.handle(createRequest())).rejects.toThrow(
			'OpenAI API error 429',
		)
	})

	it('throws when no choices are returned', async () => {
		const fetchMock = createFetchMock({ choices: [] })
		vi.stubGlobal('fetch', fetchMock)

		const adapter = new OpenAiAgentRuntimeAdapter('key', 'gpt-4o-mini')
		await expect(adapter.handle(createRequest())).rejects.toThrow('no choices')
	})
})
