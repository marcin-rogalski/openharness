import { describe, expect, it } from 'vitest'
import LocalToolProviderAdapter from './LocalToolProviderAdapter'

describe('LocalToolProviderAdapter', () => {
	it('lists the mock tool', async () => {
		const adapter = new LocalToolProviderAdapter()
		const tools = await adapter.listTools()

		expect(tools).toHaveLength(1)
		expect(tools[0]).toMatchObject({
			id: 'mock_tool',
			name: 'Mock Tool',
			sandboxLevel: 'none',
		})
	})

	it('returns the mock tool by id', async () => {
		const adapter = new LocalToolProviderAdapter()
		const tool = await adapter.getTool('mock_tool')

		expect(tool).not.toBeNull()
		expect(tool?.id).toBe('mock_tool')
	})

	it('returns null for unknown tools', async () => {
		const adapter = new LocalToolProviderAdapter()
		const tool = await adapter.getTool('unknown')

		expect(tool).toBeNull()
	})

	it('executes the mock tool and echoes input', async () => {
		const adapter = new LocalToolProviderAdapter()
		const result = await adapter.execute('mock_tool', { query: 'hello' })

		expect(result.status).toBe('success')
		expect(result.output).toEqual({ echoed: { query: 'hello' } })
		expect(result.error).toBeNull()
	})

	it('returns an error for unknown tools', async () => {
		const adapter = new LocalToolProviderAdapter()
		const result = await adapter.execute('unknown', {})

		expect(result.status).toBe('error')
		expect(result.error).toBe('Unknown tool: unknown')
	})
})
