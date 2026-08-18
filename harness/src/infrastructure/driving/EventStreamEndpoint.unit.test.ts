import { Server } from '@openharness/tempo'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import type { EventLogPort } from '@/application/ports/adapters/EventLogPort'
import type { SessionEvent } from '@/domain/SessionEvent'
import InMemoryEventPublisherAdapter from '@/infrastructure/driven/InMemoryEventPublisherAdapter'
import EventStreamEndpoint from './EventStreamEndpoint'

function makeEvent(overrides: Partial<SessionEvent> = {}): SessionEvent {
	return {
		id: 'event-1',
		sessionId: 'session-1',
		projectId: 'project-1',
		turnId: null,
		stepId: null,
		timestamp: '2025-01-01T00:00:00Z',
		actor: 'system',
		type: 'session_created',
		payload: { message: 'hello' },
		visibility: 'both',
		...overrides,
	}
}

function readStreamOnce(
	body: ReadableStream<Uint8Array>,
	timeoutMs = 2000,
): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = body.getReader()
		const decoder = new TextDecoder()
		const timer = setTimeout(() => {
			reader.cancel()
			reject(new Error('Stream read timed out'))
		}, timeoutMs)
		reader.read().then(
			({ done, value }) => {
				clearTimeout(timer)
				if (done) {
					resolve('')
				} else {
					resolve(decoder.decode(value))
				}
			},
			(err) => {
				clearTimeout(timer)
				reject(err)
			},
		)
	})
}

describe('EventStreamEndpoint', () => {
	let server: Server
	let port: number
	let publisher: InMemoryEventPublisherAdapter
	let eventLog: EventLogPort

	beforeAll(async () => {
		publisher = new InMemoryEventPublisherAdapter()
		eventLog = {
			append: vi.fn(),
			listBySession: vi.fn().mockResolvedValue([]),
		}

		server = new Server({ port: 0 })
		const endpoint = new EventStreamEndpoint(publisher, eventLog)
		endpoint.register(server)
		port = await server.start()
	})

	afterAll(async () => {
		await server.stop()
	})

	it('streams events as SSE frames', async () => {
		const controller = new AbortController()

		const responsePromise = fetch(
			`http://localhost:${port}/api/sessions/session-1/events`,
			{ signal: controller.signal },
		)

		await new Promise((r) => setTimeout(r, 100))

		publisher.publish(makeEvent())

		const response = await responsePromise
		expect(response.status).toBe(200)
		expect(response.headers.get('content-type')).toBe('text/event-stream')

		const text = await readStreamOnce(response.body!)
		expect(text).toContain('id: event-1')
		expect(text).toContain('data:')

		controller.abort()
	})

	it('returns 400 when sessionId is missing', async () => {
		const response = await fetch(
			`http://localhost:${port}/api/sessions//events`,
		)
		expect(response.status).toBe(400)
	})

	it('replays missed events on Last-Event-ID', async () => {
		const events = [
			makeEvent({ id: 'e1' }),
			makeEvent({ id: 'e2' }),
			makeEvent({ id: 'e3' }),
		]
		vi.mocked(eventLog.listBySession).mockResolvedValueOnce(events)

		const controller = new AbortController()
		const response = await fetch(
			`http://localhost:${port}/api/sessions/session-1/events`,
			{
				headers: { 'Last-Event-ID': 'e1' },
				signal: controller.signal,
			},
		)

		expect(response.status).toBe(200)

		const text = await readStreamOnce(response.body!)
		expect(text).toContain('id: e2')
		expect(text).toContain('id: e3')

		controller.abort()
	})
})
