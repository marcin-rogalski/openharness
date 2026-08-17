import { existsSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { SessionEvent } from '@/domain/SessionEvent'
import {
	buildFixture,
	extractTurnsFromEvents,
	recordFixture,
	refreshFixture,
	writeFixture,
} from './RecordFixture'

function makeEvent(overrides: Partial<SessionEvent>): SessionEvent {
	return {
		id: 'evt-1',
		sessionId: 'sess-1',
		projectId: 'proj-1',
		turnId: null,
		stepId: null,
		timestamp: '2026-01-01T00:00:00Z',
		actor: 'agent',
		type: 'model_output_received',
		payload: {
			thinking: null,
			toolCalls: [],
			response: 'Hello',
		},
		visibility: 'both',
		...overrides,
	}
}

describe('extractTurnsFromEvents', () => {
	it('extracts turns from model_output_received events', () => {
		const events = [
			makeEvent({ type: 'session_created', payload: {} }),
			makeEvent({
				type: 'model_output_received',
				payload: {
					thinking: 'thinking',
					toolCalls: [{ tool: 'read', input: 'a', output: 'b' }],
					response: 'done',
				},
			}),
			makeEvent({ type: 'user_message', payload: { content: 'hi' } }),
		]

		const turns = extractTurnsFromEvents(events)
		expect(turns).toHaveLength(1)
		expect(turns[0]).toEqual({
			thinking: 'thinking',
			toolCalls: [{ tool: 'read', input: 'a', output: 'b' }],
			response: 'done',
		})
	})

	it('returns empty array when no model events', () => {
		const events = [makeEvent({ type: 'user_message', payload: {} })]
		expect(extractTurnsFromEvents(events)).toHaveLength(0)
	})

	it('redacts secrets in responses', () => {
		const events = [
			makeEvent({
				payload: {
					thinking: null,
					toolCalls: [],
					response: 'Your api_key: sk-abc123 is set',
				},
			}),
		]
		const turns = extractTurnsFromEvents(events)
		expect(turns[0].response).toContain('[REDACTED]')
		expect(turns[0].response).not.toContain('sk-abc123')
	})
})

describe('buildFixture', () => {
	it('creates a fixture with name and turns', () => {
		const fixture = buildFixture('test', [
			{ thinking: null, toolCalls: [], response: 'hi' },
		])
		expect(fixture.name).toBe('test')
		expect(fixture.turns).toHaveLength(1)
		expect(fixture.description).toBeUndefined()
	})

	it('includes description when provided', () => {
		const fixture = buildFixture('test', [], 'A test fixture')
		expect(fixture.description).toBe('A test fixture')
	})
})

describe('writeFixture', () => {
	let tmpDir: string

	beforeEach(() => {
		tmpDir = path.join(tmpdir(), `fixture-test-${Date.now()}`)
	})

	afterEach(() => {
		if (existsSync(tmpDir)) {
			rmSync(tmpDir, { recursive: true, force: true })
		}
	})

	it('writes fixture as JSON to the output directory', () => {
		const fixture = buildFixture('my-test', [
			{ thinking: null, toolCalls: [], response: 'ok' },
		])
		const filePath = writeFixture(fixture, tmpDir)

		expect(existsSync(filePath)).toBe(true)
		const content = JSON.parse(readFileSync(filePath, 'utf-8'))
		expect(content.name).toBe('my-test')
		expect(content.turns).toHaveLength(1)
	})
})

describe('recordFixture', () => {
	let tmpDir: string

	beforeEach(() => {
		tmpDir = path.join(tmpdir(), `record-test-${Date.now()}`)
	})

	afterEach(() => {
		if (existsSync(tmpDir)) {
			rmSync(tmpDir, { recursive: true, force: true })
		}
	})

	it('records events into a fixture file', () => {
		const events = [
			makeEvent({
				payload: {
					thinking: null,
					toolCalls: [],
					response: 'Recorded response',
				},
			}),
		]

		const filePath = recordFixture(events, {
			name: 'recorded',
			outputDir: tmpDir,
		})

		expect(existsSync(filePath)).toBe(true)
		const content = JSON.parse(readFileSync(filePath, 'utf-8'))
		expect(content.name).toBe('recorded')
		expect(content.turns[0].response).toBe('Recorded response')
	})

	it('throws when no model events found', () => {
		const events = [makeEvent({ type: 'user_message', payload: {} })]
		expect(() =>
			recordFixture(events, { name: 'empty', outputDir: tmpDir }),
		).toThrow('No model_output_received events')
	})
})

describe('refreshFixture', () => {
	let tmpDir: string
	let fixturePath: string

	beforeEach(() => {
		tmpDir = path.join(tmpdir(), `refresh-test-${Date.now()}`)
		const { mkdirSync, writeFileSync } =
			require('node:fs') as typeof import('node:fs')
		mkdirSync(tmpDir, { recursive: true })
		fixturePath = path.join(tmpDir, 'existing.json')
		writeFileSync(
			fixturePath,
			JSON.stringify({
				name: 'existing',
				turns: [{ thinking: null, toolCalls: [], response: 'old' }],
			}),
		)
	})

	afterEach(() => {
		if (existsSync(tmpDir)) {
			rmSync(tmpDir, { recursive: true, force: true })
		}
	})

	it('replaces turns with new events', () => {
		const events = [
			makeEvent({
				payload: {
					thinking: 'new thinking',
					toolCalls: [],
					response: 'new response',
				},
			}),
		]

		const resultPath = refreshFixture(fixturePath, events)
		expect(resultPath).toBe(fixturePath)

		const content = JSON.parse(readFileSync(fixturePath, 'utf-8'))
		expect(content.name).toBe('existing')
		expect(content.turns[0].response).toBe('new response')
		expect(content.turns[0].thinking).toBe('new thinking')
	})

	it('throws when no model events in new data', () => {
		const events = [makeEvent({ type: 'user_message', payload: {} })]
		expect(() => refreshFixture(fixturePath, events)).toThrow(
			'No model_output_received events',
		)
	})
})
