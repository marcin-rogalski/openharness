import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Server } from '@openharness/tempo'
import type { EventLogPort } from '@/application/ports/adapters/EventLogPort'
import type { EventPublisherPort } from '@/application/ports/adapters/EventPublisherPort'

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

				const lastEventId = req.headers['last-event-id'] as string | undefined

				const writeEvent = (event: {
					id: string
					payload: Record<string, unknown>
				}) => {
					res.write(`id: ${event.id}\n`)
					res.write(`data: ${JSON.stringify(event.payload)}\n\n`)
				}

				const listener = (event: {
					id: string
					payload: Record<string, unknown>
				}) => {
					writeEvent(event)
				}

				this.publisher.subscribe(sessionId, listener)

				if (lastEventId) {
					this.eventLog
						.listBySession(sessionId)
						.then((events) => {
							const index = events.findIndex((e) => e.id === lastEventId)
							const missed = index === -1 ? events : events.slice(index + 1)
							for (const event of missed) {
								writeEvent(event)
							}
						})
						.catch(() => {
							res.write(
								`data: ${JSON.stringify({ error: 'replay_failed' })}\n\n`,
							)
						})
				}

				req.on('close', () => {
					this.publisher.unsubscribe(sessionId, listener)
					res.end()
				})
			},
		)
	}
}
