import { describe, expect, it } from 'vitest'
import type { AgentRuntimeRequest } from '@/application/ports/adapters/AgentRuntimePort'
import type { ReplayFixture } from './FixtureSchema'
import ReplayAgentRuntimeAdapter, {
	FixtureUnderrunError,
} from './ReplayAgentRuntimeAdapter'

function createRequest(overrides?: Partial<AgentRuntimeRequest>): AgentRuntimeRequest {
	return {
		sessionId: 'session-1',
		projectId: 'project-1',
		turnId: 'turn-1',
		step: 0,
		context: [{ role: 'user', content: 'Hello' }],
		tools: [],
		...overrides,
	}
}

function createFixture(turns: ReplayFixture['turns']): ReplayFixture {
	return { name: 'test', turns }
}

describe('ReplayAgentRuntimeAdapter', () => {
	it('returns the first step on first call', async () => {
		const fixture = createFixture([
			{ thinking: null, toolCalls: [], response: 'Hi there' },
		])
		const adapter = new ReplayAgentRuntimeAdapter(fixture)

		const result = await adapter.handle(createRequest())

		expect(result.response).toBe('Hi there')
		expect(result.thinking).toBeNull()
		expect(result.toolCalls).toEqual([])
		expect(result.finishReason).toBe('stop')
		expect(result.usage).toEqual({ inputTokens: 100, outputTokens: 50 })
	})

	it('returns subsequent steps in order', async () => {
		const fixture = createFixture([
			{ thinking: null, toolCalls: [], response: 'First' },
			{ thinking: 'thinking...', toolCalls: [], response: 'Second' },
		])
		const adapter = new ReplayAgentRuntimeAdapter(fixture)

		const first = await adapter.handle(createRequest())
		const second = await adapter.handle(createRequest())

		expect(first.response).toBe('First')
		expect(second.response).toBe('Second')
		expect(second.thinking).toBe('thinking...')
	})

	it('returns tool calls with generated IDs and finishReason tool_calls', async () => {
		const fixture = createFixture([
			{
				thinking: null,
				toolCalls: [{ tool: 'search', input: 'query' }],
				response: '',
			},
		])
		const adapter = new ReplayAgentRuntimeAdapter(fixture)

		const result = await adapter.handle(createRequest())

		expect(result.toolCalls).toHaveLength(1)
		expect(result.toolCalls[0].tool).toBe('search')
		expect(result.toolCalls[0].input).toBe('query')
		expect(result.toolCalls[0].id).toBe('replay-call-1-search')
		expect(result.finishReason).toBe('tool_calls')
	})

	it('uses explicit IDs from the fixture when provided', async () => {
		const fixture = createFixture([
			{
				thinking: null,
				toolCalls: [{ id: 'custom-id', tool: 'search', input: 'query' }],
				response: '',
			},
		])
		const adapter = new ReplayAgentRuntimeAdapter(fixture)

		const result = await adapter.handle(createRequest())

		expect(result.toolCalls[0].id).toBe('custom-id')
	})

	it('throws FixtureUnderrunError when fixture is exhausted', async () => {
		const fixture = createFixture([
			{ thinking: null, toolCalls: [], response: 'Only one' },
		])
		const adapter = new ReplayAgentRuntimeAdapter(fixture)

		await adapter.handle(createRequest())

		await expect(adapter.handle(createRequest())).rejects.toThrow(
			FixtureUnderrunError,
		)
	})

	it('tracks consumed steps', async () => {
		const fixture = createFixture([
			{ thinking: null, toolCalls: [], response: 'A' },
			{ thinking: null, toolCalls: [], response: 'B' },
			{ thinking: null, toolCalls: [], response: 'C' },
		])
		const adapter = new ReplayAgentRuntimeAdapter(fixture)

		expect(adapter.consumedSteps).toBe(0)
		expect(adapter.totalSteps).toBe(3)
		expect(adapter.isExhausted).toBe(false)

		await adapter.handle(createRequest())
		expect(adapter.consumedSteps).toBe(1)
		expect(adapter.isExhausted).toBe(false)

		await adapter.handle(createRequest())
		await adapter.handle(createRequest())
		expect(adapter.consumedSteps).toBe(3)
		expect(adapter.isExhausted).toBe(true)
	})

	it('resets to the beginning', async () => {
		const fixture = createFixture([
			{ thinking: null, toolCalls: [], response: 'First' },
		])
		const adapter = new ReplayAgentRuntimeAdapter(fixture)

		await adapter.handle(createRequest())
		expect(adapter.isExhausted).toBe(true)

		adapter.reset()
		expect(adapter.isExhausted).toBe(false)
		expect(adapter.consumedSteps).toBe(0)

		const result = await adapter.handle(createRequest())
		expect(result.response).toBe('First')
	})
})
