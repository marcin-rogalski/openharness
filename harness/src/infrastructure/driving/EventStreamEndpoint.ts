import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Server } from '@openharness/tempo'
import type { EventLogPort } from '@/application/ports/adapters/EventLogPort'
import type { EventPublisherPort } from '@/application/ports/adapters/EventPublisherPort'
import type { SessionEvent } from '@/domain/SessionEvent'

export default class EventStreamEndpoint {
	constructor(
		private readonly publisher: EventPublisherPort,
		private readonly eventLog: EventLogPort,
	) {}

	register(server: Server): void {
		server.registerRaw(
			'GET',
			'/api/sessions/:sessionId/events',
			(
				req: IncomingMessage,
				res: ServerResponse,
				params: Record<string, string>,
			) => {
				const sessionId = params.sessionId
				if (!sessionId) {
					res.writeHead(400, { 'Content-Type': 'application/json' })
					res.end(JSON.stringify({ error: 'sessionId is required' }))
					return
				}

				res.writeHead(200, {
					'Content-Type': 'text/event-stream',
					'Cache-Control': 'no-cache',
					Connection: 'keep-alive',
					'X-Accel-Buffering': 'no',
				})

				const sentIds = new Set<string>()
				const buffer: SessionEvent[] = []
				let replayDone = false

				const writeEvent = (event: SessionEvent) => {
					if (sentIds.has(event.id)) return
					sentIds.add(event.id)
					res.write(`id: ${event.id}\n`)
					res.write(`data: ${JSON.stringify(event)}\n\n`)
				}

				const listener = (event: SessionEvent) => {
					if (replayDone) {
						writeEvent(event)
					} else {
						buffer.push(event)
					}
				}

				this.publisher.subscribe(sessionId, listener)

				this.eventLog
					.listBySession(sessionId)
					.then((events) => {
						for (const event of events) {
							writeEvent(event)
						}
						replayDone = true
						for (const event of buffer) {
							writeEvent(event)
						}
						buffer.length = 0
					})
					.catch(() => {
						res.write(`data: ${JSON.stringify({ error: 'replay_failed' })}\n\n`)
						replayDone = true
						for (const event of buffer) {
							writeEvent(event)
						}
						buffer.length = 0
					})

				req.on('close', () => {
					this.publisher.unsubscribe(sessionId, listener)
					res.end()
				})
			},
		)
	}
}
