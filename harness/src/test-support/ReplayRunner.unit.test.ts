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
		expect(result.events).toHaveLength(6)

		const types = result.events.map((e) => e.type)
		expect(types).toEqual([
			'session_created',
			'user_message',
			'turn_started',
			'step_started',
			'model_output_received',
			'turn_ended',
		])

		const userEvent = result.events[1]
		expect(userEvent.actor).toBe('user')
		expect(userEvent.payload).toEqual({ content: 'Hi there' })

		const modelEvent = result.events[4]
		expect(modelEvent.actor).toBe('agent')
		expect(modelEvent.payload).toEqual({
			thinking: null,
			toolCalls: [],
			response: 'Hello! How can I help you today?',
			finishReason: 'stop',
			usage: { inputTokens: 100, outputTokens: 50 },
		})

		const turnEnded = result.events[5]
		expect(turnEnded.payload).toEqual({ reason: 'completed' })
	})

	it('records tool calls and produces tool events', async () => {
		const fixture = loadFixture(path.join(FIXTURES_DIR, 'tool-call.json'))
		const runner = new ReplayRunner(fixture, testProject)

		const result = await runner.send('Read the main file')

		expect(result.events).toHaveLength(10)

		const types = result.events.map((e) => e.type)
		expect(types).toEqual([
			'session_created',
			'user_message',
			'turn_started',
			'step_started',
			'model_output_received',
			'tool_call_requested',
			'tool_result_produced',
			'step_started',
			'model_output_received',
			'turn_ended',
		])

		const firstModelEvent = result.events[4]
		expect(firstModelEvent.payload).toEqual({
			thinking: 'I need to read the file to answer this question.',
			toolCalls: [
				{
					id: 'replay-call-1-read_file',
					tool: 'read_file',
					input: 'path=src/index.ts',
				},
			],
			response: '',
			finishReason: 'tool_calls',
			usage: { inputTokens: 100, outputTokens: 50 },
		})

		const toolCallEvent = result.events[5]
		expect(toolCallEvent.payload.toolId).toBe('read_file')

		const toolResultEvent = result.events[6]
		expect(toolResultEvent.payload.status).toBe('error')
		expect(toolResultEvent.payload.error).toBe('Tool not found: read_file')

		const secondModelEvent = result.events[8]
		expect(secondModelEvent.payload).toEqual({
			thinking: null,
			toolCalls: [],
			response: "I've read the file. The main function is a no-op.",
			finishReason: 'stop',
			usage: { inputTokens: 100, outputTokens: 50 },
		})
	})

	it('reuses the session on subsequent sends', async () => {
		const fixture = loadFixture(path.join(FIXTURES_DIR, 'multi-turn.json'))
		const runner = new ReplayRunner(fixture, testProject)

		const first = await runner.send('First message')
		expect(first.events).toHaveLength(6)

		const second = await runner.send('Second message')
		expect(second.sessionId).toBe(first.sessionId)
		expect(second.events).toHaveLength(11)

		const sessionCreatedCount = second.events.filter(
			(e) => e.type === 'session_created',
		).length
		expect(sessionCreatedCount).toBe(1)

		const secondUserMsg = second.events[6]
		expect(secondUserMsg.type).toBe('user_message')
		expect(secondUserMsg.payload).toEqual({ content: 'Second message' })

		const secondModelEvent = second.events[10]
		expect(secondModelEvent.type).toBe('turn_ended')
	})

	it('detects fixture underrun when too many sends', async () => {
		const fixture = loadFixture(path.join(FIXTURES_DIR, 'simple-message.json'))
		const runner = new ReplayRunner(fixture, testProject)

		await runner.send('First')
		const result = await runner.send('Second')

		const errorEvent = result.events.find((e) => e.type === 'error_occurred')
		expect(errorEvent).toBeDefined()
		expect(errorEvent!.payload.error).toContain('Fixture underrun')

		const turnEndedEvents = result.events.filter(
			(e) => e.type === 'turn_ended',
		)
		expect(turnEndedEvents.at(-1)!.payload.reason).toBe('error')
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
				type: 'turn_started',
				actor: 'agent',
				payload: { maxSteps: 20 },
			}),
			makeEvent({
				type: 'step_started',
				actor: 'agent',
				payload: { step: 0 },
			}),
			makeEvent({
				type: 'model_output_received',
				actor: 'agent',
				payload: {
					thinking: null,
					toolCalls: [],
					response: 'Hello! How can I help you today?',
					finishReason: 'stop',
					usage: { inputTokens: 100, outputTokens: 50 },
				},
			}),
			makeEvent({
				type: 'turn_ended',
				actor: 'agent',
				payload: { reason: 'completed' },
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
				type: 'turn_started',
				actor: 'agent',
				payload: { maxSteps: 20 },
			}),
			makeEvent({
				type: 'step_started',
				actor: 'agent',
				payload: { step: 0 },
			}),
			makeEvent({
				type: 'model_output_received',
				actor: 'agent',
				payload: {
					thinking: null,
					toolCalls: [],
					response: 'Different response',
					finishReason: 'stop',
					usage: { inputTokens: 100, outputTokens: 50 },
				},
			}),
			makeEvent({
				type: 'turn_ended',
				actor: 'agent',
				payload: { reason: 'completed' },
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
