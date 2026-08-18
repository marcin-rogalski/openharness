import { describe, expect, it } from 'vitest'
import LocalToolProviderAdapter from './LocalToolProviderAdapter'

describe('LocalToolProviderAdapter', () => {
	it('lists all registered tools', async () => {
		const adapter = new LocalToolProviderAdapter()
		const tools = await adapter.listTools()

		expect(tools).toHaveLength(2)
		const ids = tools.map((t) => t.id)
		expect(ids).toContain('clock')
		expect(ids).toContain('web_search')
	})

	it('returns the clock tool by id', async () => {
		const adapter = new LocalToolProviderAdapter()
		const tool = await adapter.getTool('clock')

		expect(tool).not.toBeNull()
		expect(tool?.id).toBe('clock')
		expect(tool?.name).toBe('Clock')
	})

	it('returns the web_search tool by id', async () => {
		const adapter = new LocalToolProviderAdapter()
		const tool = await adapter.getTool('web_search')

		expect(tool).not.toBeNull()
		expect(tool?.id).toBe('web_search')
		expect(tool?.name).toBe('Web Search')
	})

	it('returns null for unknown tools', async () => {
		const adapter = new LocalToolProviderAdapter()
		const tool = await adapter.getTool('unknown')

		expect(tool).toBeNull()
	})

	it('executes the clock tool', async () => {
		const adapter = new LocalToolProviderAdapter()
		const result = await adapter.execute('clock', { format: 'unix' })

		expect(result.status).toBe('success')
		expect(result.output).toHaveProperty('timestamp')
		expect(result.error).toBeNull()
	})

	it('executes the clock tool with iso format', async () => {
		const adapter = new LocalToolProviderAdapter()
		const result = await adapter.execute('clock', { format: 'iso' })

		expect(result.status).toBe('success')
		expect(result.output).toHaveProperty('iso')
		expect(result.output).toHaveProperty('local')
	})

	it('returns an error for unknown tools', async () => {
		const adapter = new LocalToolProviderAdapter()
		const result = await adapter.execute('unknown', {})

		expect(result.status).toBe('error')
		expect(result.error).toBe('Unknown tool: unknown')
	})
})
