import type { ToolResult } from '@/domain/ToolResult'
import type { Tool } from './Tool'

export default class ClockTool implements Tool {
	readonly definition = {
		id: 'clock',
		name: 'Clock',
		description:
			'Get the current date and time. Supports ISO, relative, and unix formats.',
		inputSchema: {
			type: 'object',
			properties: {
				format: {
					type: 'string',
					enum: ['iso', 'relative', 'unix'],
					description: 'Output format (default: iso)',
				},
				timezone: {
					type: 'string',
					description: 'IANA timezone (e.g. Europe/Warsaw)',
				},
			},
		},
		sandboxLevel: 'none' as const,
	}

	async execute(input: Record<string, unknown>): Promise<ToolResult> {
		const now = new Date()
		const format = (input.format as string) ?? 'iso'
		const timezone = input.timezone as string | undefined

		let output: Record<string, unknown>

		switch (format) {
			case 'unix':
				output = { timestamp: Math.floor(now.getTime() / 1000) }
				break
			case 'relative': {
				const diff = Date.now() - now.getTime()
				output = {
					iso: now.toISOString(),
					relative: `now (${diff}ms ago)`,
				}
				break
			}

			default: {
				let local: string
				try {
					local = timezone
						? now.toLocaleString('en-US', { timeZone: timezone })
						: now.toLocaleString()
				} catch {
					local = now.toLocaleString()
				}
				output = {
					iso: now.toISOString(),
					local,
				}
				break
			}
		}

		return {
			toolCallId: '',
			status: 'success',
			output,
			error: null,
			frozen: false,
		}
	}
}
