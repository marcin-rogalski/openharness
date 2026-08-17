import { describe, expect, it } from 'vitest'
import type { AgentRuntimeRequest } from '@/application/ports/adapters/AgentRuntimePort'
import type { ReplayFixture } from './FixtureSchema'
import ReplayAgentRuntimeAdapter, {
	FixtureUnderrunError,
} from './ReplayAgentRuntimeAdapter'

function createRequest(): AgentRuntimeRequest {
	return {
		sessionId: 'session-1',
		projectId: 'project-1',
		context: [{ role: 'user', content: 'Hello' }],
	}
}

function createFixture(turns: ReplayFixture['turns']): ReplayFixture {
	return { name: 'test', turns }
}

describe('ReplayAgentRuntimeAdapter', () => {
	it('returns the first turn on first call', async () => {
		const fixture = createFixture([
			{ thinking: null, toolCalls: [], response: 'Hi there' },
		])
		const adapter = new ReplayAgentRuntimeAdapter(fixture)

		const result = await adapter.handle(createRequest())

		expect(result.response).toBe('Hi there')
		expect(result.thinking).toBeNull()
		expect(result.toolCalls).toEqual([])
	})

	it('returns subsequent turns in order', async () => {
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

	it('returns tool calls from the fixture', async () => {
		const fixture = createFixture([
			{
				thinking: null,
				toolCalls: [{ tool: 'search', input: 'query', output: 'result' }],
				response: 'Found it',
			},
		])
		const adapter = new ReplayAgentRuntimeAdapter(fixture)

		const result = await adapter.handle(createRequest())

		expect(result.toolCalls).toHaveLength(1)
		expect(result.toolCalls[0].tool).toBe('search')
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

	it('tracks consumed turns', async () => {
		const fixture = createFixture([
			{ thinking: null, toolCalls: [], response: 'A' },
			{ thinking: null, toolCalls: [], response: 'B' },
			{ thinking: null, toolCalls: [], response: 'C' },
		])
		const adapter = new ReplayAgentRuntimeAdapter(fixture)

		expect(adapter.consumedTurns).toBe(0)
		expect(adapter.totalTurns).toBe(3)
		expect(adapter.isExhausted).toBe(false)

		await adapter.handle(createRequest())
		expect(adapter.consumedTurns).toBe(1)
		expect(adapter.isExhausted).toBe(false)

		await adapter.handle(createRequest())
		await adapter.handle(createRequest())
		expect(adapter.consumedTurns).toBe(3)
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
		expect(adapter.consumedTurns).toBe(0)

		const result = await adapter.handle(createRequest())
		expect(result.response).toBe('First')
	})
})
