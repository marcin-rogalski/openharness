import { describe, expect, it } from 'vitest'
import ClockTool from './ClockTool'

describe('ClockTool', () => {
	const tool = new ClockTool()

	it('has the correct definition', () => {
		expect(tool.definition.id).toBe('clock')
		expect(tool.definition.name).toBe('Clock')
		expect(tool.definition.sandboxLevel).toBe('none')
	})

	it('returns unix timestamp by default format', async () => {
		const result = await tool.execute({ format: 'unix' })

		expect(result.status).toBe('success')
		expect(result.output).toHaveProperty('timestamp')
		expect(typeof result.output.timestamp).toBe('number')
		expect(result.error).toBeNull()
	})

	it('returns iso format with local time', async () => {
		const result = await tool.execute({ format: 'iso' })

		expect(result.status).toBe('success')
		expect(result.output).toHaveProperty('iso')
		expect(result.output).toHaveProperty('local')
		expect(result.error).toBeNull()
	})

	it('returns iso format when no format specified', async () => {
		const result = await tool.execute({})

		expect(result.status).toBe('success')
		expect(result.output).toHaveProperty('iso')
		expect(result.output).toHaveProperty('local')
	})

	it('returns relative format', async () => {
		const result = await tool.execute({ format: 'relative' })

		expect(result.status).toBe('success')
		expect(result.output).toHaveProperty('iso')
		expect(result.output).toHaveProperty('relative')
		expect(String(result.output.relative)).toContain('now')
	})

	it('uses custom timezone when provided', async () => {
		const result = await tool.execute({
			format: 'iso',
			timezone: 'Europe/Warsaw',
		})

		expect(result.status).toBe('success')
		expect(result.output).toHaveProperty('local')
	})

	it('falls back to default timezone when timezone is invalid', async () => {
		const result = await tool.execute({
			format: 'iso',
			timezone: 'Invalid/Zone',
		})

		expect(result.status).toBe('success')
		expect(result.output).toHaveProperty('local')
	})
})
