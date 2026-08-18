import { describe, expect, it, vi } from 'vitest'
import WebSearchTool from './WebSearchTool'

describe('WebSearchTool', () => {
	const tool = new WebSearchTool()

	it('has the correct definition', () => {
		expect(tool.definition.id).toBe('web_search')
		expect(tool.definition.name).toBe('Web Search')
		expect(tool.definition.sandboxLevel).toBe('none')
	})

	it('returns error when query is missing', async () => {
		const result = await tool.execute({})

		expect(result.status).toBe('error')
		expect(result.error).toBe('Missing required parameter: query')
	})

	it('returns error when query is empty string', async () => {
		const result = await tool.execute({ query: '' })

		expect(result.status).toBe('error')
		expect(result.error).toBe('Missing required parameter: query')
	})

	it('returns search results on success', async () => {
		const mockData = {
			AbstractText: 'Test abstract',
			AbstractURL: 'https://example.com',
			RelatedTopics: [
				{ Text: 'Title 1 -- Snippet 1', FirstURL: 'https://ex.com/1' },
				{ Text: 'Title 2 -- Snippet 2', FirstURL: 'https://ex.com/2' },
			],
		}

		vi.spyOn(globalThis, 'fetch').mockResolvedValue({
			ok: true,
			json: async () => mockData,
		} as Response)

		const result = await tool.execute({ query: 'test', maxResults: 5 })

		expect(result.status).toBe('success')
		expect(result.output).toHaveProperty('query', 'test')
		expect(result.output).toHaveProperty('results')
		const results = result.output.results as Record<string, unknown>[]
		expect(results.length).toBeGreaterThan(0)
		expect(results[0]).toHaveProperty('title')
		expect(results[0]).toHaveProperty('url')
		expect(results[0]).toHaveProperty('snippet')
	})

	it('respects maxResults limit', async () => {
		const mockData = {
			AbstractText: 'Abstract',
			AbstractURL: 'https://example.com',
			RelatedTopics: [
				{ Text: 'T1 -- S1', FirstURL: 'https://ex.com/1' },
				{ Text: 'T2 -- S2', FirstURL: 'https://ex.com/2' },
				{ Text: 'T3 -- S3', FirstURL: 'https://ex.com/3' },
			],
		}

		vi.spyOn(globalThis, 'fetch').mockResolvedValue({
			ok: true,
			json: async () => mockData,
		} as Response)

		const result = await tool.execute({ query: 'test', maxResults: 2 })

		expect(result.status).toBe('success')
		const results = result.output.results as Record<string, unknown>[]
		expect(results).toHaveLength(2)
	})

	it('handles topics without separator', async () => {
		const mockData = {
			AbstractText: null,
			AbstractURL: null,
			RelatedTopics: [
				{ Text: 'No separator here', FirstURL: 'https://ex.com' },
			],
		}

		vi.spyOn(globalThis, 'fetch').mockResolvedValue({
			ok: true,
			json: async () => mockData,
		} as Response)

		const result = await tool.execute({ query: 'test' })

		expect(result.status).toBe('success')
		const results = result.output.results as Record<string, unknown>[]
		expect(results).toHaveLength(1)
		expect(results[0].title).toBe('No separator here')
		expect(results[0].snippet).toBe('')
	})

	it('handles null RelatedTopics', async () => {
		const mockData = {
			AbstractText: 'Only abstract',
			AbstractURL: 'https://example.com',
			RelatedTopics: null,
		}

		vi.spyOn(globalThis, 'fetch').mockResolvedValue({
			ok: true,
			json: async () => mockData,
		} as Response)

		const result = await tool.execute({ query: 'test' })

		expect(result.status).toBe('success')
		const results = result.output.results as Record<string, unknown>[]
		expect(results).toHaveLength(1)
	})

	it('returns error when API returns non-ok status', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValue({
			ok: false,
			status: 500,
			json: async () => ({}),
		} as Response)

		const result = await tool.execute({ query: 'test' })

		expect(result.status).toBe('error')
		expect(result.error).toContain('Search failed')
	})

	it('returns error when fetch throws', async () => {
		vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'))

		const result = await tool.execute({ query: 'test' })

		expect(result.status).toBe('error')
		expect(result.error).toContain('Search failed')
		expect(result.error).toContain('Network error')
	})
})
