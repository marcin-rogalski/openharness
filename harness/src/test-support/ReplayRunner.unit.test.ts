import path from 'node:path'
import { describe, expect, it } from 'vitest'
import type { Project } from '@/domain/Project'
import type { SessionEvent } from '@/domain/SessionEvent'
import { loadFixture } from './FixtureLoader'
import ReplayRunner, { diffEvents } from './ReplayRunner'

const FIXTURES_DIR = path.resolve(__dirname, 'fixtures')

const testProject: Project = {
	id: 'project-1',
	name: 'Test Project',
	status: 'idle',
}

function makeEvent(overrides: Partial<SessionEvent>): SessionEvent {
	return {
		id: 'test-id',
		sessionId: 'session-1',
		projectId: 'project-1',
		turnId: null,
		stepId: null,
		timestamp: '2026-01-01T00:00:00Z',
		actor: 'system',
		type: 'test',
		payload: {},
		visibility: 'both',
		...overrides,
	}
}

describe('ReplayRunner', () => {
	it('runs a simple message and produces expected events', async () => {
		const fixture = loadFixture(path.join(FIXTURES_DIR, 'simple-message.json'))
		const runner = new ReplayRunner(fixture, testProject)

		const result = await runner.send('Hi there')

		expect(result.sessionId).toBeTypeOf('string')
		expect(result.events).toHaveLength(3)

		const types = result.events.map((e) => e.type)
		expect(types).toEqual([
			'session_created',
			'user_message',
			'model_output_received',
		])

		const userEvent = result.events[1]
		expect(userEvent.actor).toBe('user')
		expect(userEvent.payload).toEqual({ content: 'Hi there' })

		const modelEvent = result.events[2]
		expect(modelEvent.actor).toBe('agent')
		expect(modelEvent.payload).toEqual({
			thinking: null,
			toolCalls: [],
			response: 'Hello! How can I help you today?',
		})
	})

	it('records tool calls in the model output event', async () => {
		const fixture = loadFixture(path.join(FIXTURES_DIR, 'tool-call.json'))
		const runner = new ReplayRunner(fixture, testProject)

		const result = await runner.send('Read the main file')

		const modelEvent = result.events[2]
		expect(modelEvent.payload).toEqual({
			thinking: 'I need to read the file to answer this question.',
			toolCalls: [
				{
					tool: 'read_file',
					input: 'path=src/index.ts',
					output: 'export const main = () => {}',
				},
			],
			response: "I've read the file. The main function is a no-op.",
		})
	})

	it('reuses the session on subsequent sends', async () => {
		const fixture = loadFixture(path.join(FIXTURES_DIR, 'multi-turn.json'))
		const runner = new ReplayRunner(fixture, testProject)

		const first = await runner.send('First message')
		expect(first.events).toHaveLength(3)

		const second = await runner.send('Second message')
		expect(second.sessionId).toBe(first.sessionId)
		expect(second.events).toHaveLength(5)

		const sessionCreatedCount = second.events.filter(
			(e) => e.type === 'session_created',
		).length
		expect(sessionCreatedCount).toBe(1)

		expect(second.events[3].type).toBe('user_message')
		expect(second.events[3].payload).toEqual({ content: 'Second message' })
		expect(second.events[4].payload).toEqual({
			thinking: 'The user is asking a follow-up.',
			toolCalls: [],
			response: 'Second response with more detail.',
		})
	})

	it('detects fixture underrun when too many sends', async () => {
		const fixture = loadFixture(path.join(FIXTURES_DIR, 'simple-message.json'))
		const runner = new ReplayRunner(fixture, testProject)

		await runner.send('First')
		await expect(runner.send('Second')).rejects.toThrow('Fixture underrun')
	})

	it('normalizes volatile ids and timestamps', async () => {
		const fixture = loadFixture(path.join(FIXTURES_DIR, 'simple-message.json'))
		const runner = new ReplayRunner(fixture, testProject)

		const result = await runner.send('Hi')

		for (const event of result.normalizedEvents) {
			expect(event.id).toMatch(/^id-\d+$/)
			expect(event.timestamp).toBe('2026-01-01T00:00:00Z')
		}
	})

	it('compare returns matches when events align', async () => {
		const fixture = loadFixture(path.join(FIXTURES_DIR, 'simple-message.json'))
		const runner = new ReplayRunner(fixture, testProject)

		await runner.send('Hi')

		const expected: SessionEvent[] = [
			makeEvent({
				type: 'session_created',
				actor: 'system',
				visibility: 'user',
				payload: { projectId: 'project-1' },
			}),
			makeEvent({
				type: 'user_message',
				actor: 'user',
				payload: { content: 'Hi' },
			}),
			makeEvent({
				type: 'model_output_received',
				actor: 'agent',
				payload: {
					thinking: null,
					toolCalls: [],
					response: 'Hello! How can I help you today?',
				},
			}),
		]

		const diff = await runner.compare(expected)
		expect(diff.matches).toBe(true)
		expect(diff.missing).toHaveLength(0)
		expect(diff.unexpected).toHaveLength(0)
	})

	it('compare reports missing and unexpected events', async () => {
		const fixture = loadFixture(path.join(FIXTURES_DIR, 'simple-message.json'))
		const runner = new ReplayRunner(fixture, testProject)

		await runner.send('Hi')

		const expected: SessionEvent[] = [
			makeEvent({
				type: 'session_created',
				actor: 'system',
				visibility: 'user',
				payload: { projectId: 'project-1' },
			}),
			makeEvent({
				type: 'user_message',
				actor: 'user',
				payload: { content: 'Hi' },
			}),
			makeEvent({
				type: 'model_output_received',
				actor: 'agent',
				payload: {
					thinking: null,
					toolCalls: [],
					response: 'Different response',
				},
			}),
		]

		const diff = await runner.compare(expected)
		expect(diff.matches).toBe(false)
		expect(diff.missing).toHaveLength(1)
		expect(diff.unexpected).toHaveLength(1)
	})
})

describe('diffEvents', () => {
	it('returns matches for identical event sequences', () => {
		const events = [
			makeEvent({ type: 'a', payload: { x: 1 } }),
			makeEvent({ type: 'b', payload: { y: 2 } }),
		]
		const diff = diffEvents(events, events)
		expect(diff.matches).toBe(true)
	})

	it('detects missing events', () => {
		const actual = [makeEvent({ type: 'a', payload: {} })]
		const expected = [
			makeEvent({ type: 'a', payload: {} }),
			makeEvent({ type: 'b', payload: {} }),
		]
		const diff = diffEvents(actual, expected)
		expect(diff.matches).toBe(false)
		expect(diff.missing).toHaveLength(1)
		expect(diff.missing[0].type).toBe('b')
	})

	it('detects unexpected events', () => {
		const actual = [
			makeEvent({ type: 'a', payload: {} }),
			makeEvent({ type: 'c', payload: {} }),
		]
		const expected = [makeEvent({ type: 'a', payload: {} })]
		const diff = diffEvents(actual, expected)
		expect(diff.matches).toBe(false)
		expect(diff.unexpected).toHaveLength(1)
		expect(diff.unexpected[0].type).toBe('c')
	})
})

describe('normalizeEvents integration', () => {
	it('produces stable output across runs', async () => {
		const fixture = loadFixture(path.join(FIXTURES_DIR, 'simple-message.json'))

		const runner1 = new ReplayRunner(fixture, testProject)
		const result1 = await runner1.send('Hi')

		const runner2 = new ReplayRunner(fixture, testProject)
		const result2 = await runner2.send('Hi')

		expect(result1.normalizedEvents).toEqual(result2.normalizedEvents)
	})
})
