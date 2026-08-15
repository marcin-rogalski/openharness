import {
	createServer as createHttpServer,
	type IncomingMessage,
	type ServerResponse,
} from 'node:http'
import Router from 'find-my-way'
import type { EndpointInfo } from './types'
import { ValidationError } from './types'

export interface ServerOptions {
	port?: number
	host?: string
	/** Called when a request is not found. */
	on404?: (method: string, path: string) => { status: number; body: unknown }
	/** Called when an internal error occurs. */
	onError?: (
		error: Error,
		method: string,
		path: string,
	) => { status: number; body: unknown }
}

export interface RegisterableEndpoint {
	toInfo(): EndpointInfo
	createHandler(): (
		params: unknown,
		query: unknown,
		body: unknown,
		headers: unknown,
	) => Promise<unknown>
}

interface RequestWithRouterData extends IncomingMessage {
	params?: unknown
	query?: unknown
}

const DEFAULT_PORT = 3000
const DEFAULT_HOST = '0.0.0.0'

export default class Server {
	private router = Router({
		ignoreTrailingSlash: true,
		maxParamLength: 1024,
	})

	private httpServer: ReturnType<typeof createHttpServer> | null = null
	private port: number
	private host: string
	private on404: ServerOptions['on404']
	private onError: ServerOptions['onError']
	private _endpoints: EndpointInfo[] = []

	constructor(options: ServerOptions = {}) {
		this.port = options.port ?? DEFAULT_PORT
		this.host = options.host ?? DEFAULT_HOST
		this.on404 = options.on404
		this.onError = options.onError
	}

	/** Register an endpoint. Returns `this` for chaining. */
	register(endpoint: RegisterableEndpoint): this {
		const info = endpoint.toInfo()
		const handler = endpoint.createHandler()
		this.router.on(
			info.method,
			info.path,
			async (request: IncomingMessage, reply: ServerResponse) => {
				try {
					const params = (request as RequestWithRouterData).params ?? {}
					const query = (request as RequestWithRouterData).query ?? {}
					let body: unknown = {}

					if (info.schemas.body) {
						const chunks: Buffer[] = []
						for await (const chunk of request) {
							chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
						}
						const raw = Buffer.concat(chunks).toString('utf-8')
						if (raw) {
							try {
								body = JSON.parse(raw)
							} catch {
								reply.writeHead(400, { 'Content-Type': 'application/json' })
								reply.end(JSON.stringify({ error: 'Invalid JSON body' }))
								return
							}
						}
					}

					const output = await handler(params, query, body, request.headers)

					if (info.schemas.response) {
						const result = info.schemas.response.safeParse(output)
						if (!result.success) {
							reply.writeHead(500, { 'Content-Type': 'application/json' })
							reply.end(
								JSON.stringify({
									error: 'Response validation failed',
									details: result.error,
								}),
							)
							return
						}
					}

					reply.writeHead(200, { 'Content-Type': 'application/json' })
					reply.end(JSON.stringify(output))
				} catch (err) {
					if (err instanceof ValidationError) {
						reply.writeHead(400, { 'Content-Type': 'application/json' })
						reply.end(JSON.stringify({ error: err.message }))
						return
					}
					const error = err instanceof Error ? err : new Error(String(err))
					const { status, body: errorBody } = this.onError
						? this.onError(error, info.method, info.path)
						: { status: 500, body: { error: 'Internal server error' } }

					reply.writeHead(status, { 'Content-Type': 'application/json' })
					reply.end(JSON.stringify(errorBody))
				}
			},
		)
		this._endpoints.push(info)
		return this
	}

	/** Register an endpoint instance (convenience wrapper around `register`). */
	use(endpoint: RegisterableEndpoint): this {
		return this.register(endpoint)
	}

	/** Returns all registered endpoint info for introspection. */
	get endpoints(): readonly EndpointInfo[] {
		return this._endpoints
	}

	/** Start the HTTP server. Returns the bound port. */
	async start(): Promise<number> {
		this.httpServer = createHttpServer(
			(req: IncomingMessage, res: ServerResponse) => {
				this.router.lookup(req, res)
			},
		)

		await new Promise<void>((resolve, reject) => {
			this.httpServer!.listen(this.port, this.host, (err?: Error) => {
				if (err) reject(err)
				else resolve()
			})
		})

		const address = this.httpServer!.address()
		if (address && typeof address === 'object') {
			return address.port
		}
		return this.port
	}

	/** Stop the HTTP server. */
	async stop(): Promise<void> {
		return new Promise((resolve) => {
			if (this.httpServer) {
				this.httpServer.close(() => resolve())
			} else {
				resolve()
			}
		})
	}
}
