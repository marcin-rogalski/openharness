import type { ToolResult } from '@/domain/ToolResult'
import type { Tool } from './Tool'

export default class WebSearchTool implements Tool {
	readonly definition = {
		id: 'web_search',
		name: 'Web Search',
		description:
			'Search the web for information. Returns a list of results with titles, URLs, and snippets.',
		inputSchema: {
			type: 'object',
			properties: {
				query: {
					type: 'string',
					description: 'Search query',
				},
				maxResults: {
					type: 'number',
					description: 'Maximum number of results (default: 5)',
				},
			},
			required: ['query'],
		},
		sandboxLevel: 'none' as const,
	}

	async execute(input: Record<string, unknown>): Promise<ToolResult> {
		const query = input.query as string
		if (!query) {
			return {
				toolCallId: '',
				status: 'error',
				output: null,
				error: 'Missing required parameter: query',
				frozen: false,
			}
		}

		const maxResults = (input.maxResults as number) ?? 5

		try {
			const encodedQuery = encodeURIComponent(query)
			const url = `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`
			const response = await fetch(url)
			if (!response.ok) {
				throw new Error(`Search API returned ${response.status}`)
			}
			const data = (await response.json()) as {
				AbstractText?: string
				AbstractURL?: string
				RelatedTopics?: { Text?: string; FirstURL?: string }[]
			}

			const results: Record<string, unknown>[] = []

			if (data.AbstractText) {
				results.push({
					title: query,
					url: data.AbstractURL ?? '',
					snippet: data.AbstractText,
				})
			}

			for (const topic of data.RelatedTopics?.slice(0, maxResults - 1) ?? []) {
				if (topic.Text && topic.FirstURL) {
					const separator = ' -- '
					const sepIndex = topic.Text.indexOf(separator)
					results.push({
						title: sepIndex > 0 ? topic.Text.slice(0, sepIndex) : topic.Text,
						url: topic.FirstURL,
						snippet:
							sepIndex > 0 ? topic.Text.slice(sepIndex + separator.length) : '',
					})
				}
			}

			return {
				toolCallId: '',
				status: 'success',
				output: { query, results: results.slice(0, maxResults) },
				error: null,
				frozen: false,
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error)
			return {
				toolCallId: '',
				status: 'error',
				output: null,
				error: `Search failed: ${message}`,
				frozen: false,
			}
		}
	}
}
