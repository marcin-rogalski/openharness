import {
	createServer as createHttpServer,
	type IncomingMessage,
	type ServerResponse,
} from 'node:http'
import Router from 'find-my-way'
import type { EndpointInfo, HttpMethod } from './types'
import { ValidationError } from './types'

export interface CorsOptions {
	allowedOrigins?: string[]
	allowedMethods?: string[]
	allowedHeaders?: string[]
	allowCredentials?: boolean
}

interface NormalizedCorsOptions {
	allowedOrigins: string[]
	allowedMethods: string[]
	allowedHeaders: string[]
	allowCredentials: boolean
}

export interface ServerOptions {
	port?: number
	host?: string
	cors?: boolean | CorsOptions
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

export type RawHandler = (
	req: IncomingMessage,
	res: ServerResponse,
	params: Record<string, string>,
) => void | Promise<void>

function parseQuery(url: string | undefined): Record<string, string> {
	if (!url) {
		return {}
	}

	const queryString = url.split('?', 2)[1]
	if (!queryString) {
		return {}
	}

	const query: Record<string, string> = {}
	for (const [key, value] of new URLSearchParams(queryString)) {
		query[key] = value
	}
	return query
}

const DEFAULT_PORT = 3000
const DEFAULT_HOST = '0.0.0.0'

function normalizeCors(
	options: boolean | CorsOptions | undefined,
): NormalizedCorsOptions | null {
	if (!options) {
		return null
	}

	const config = options === true ? {} : options

	return {
		allowedOrigins: config.allowedOrigins ?? ['*'],
		allowedMethods: config.allowedMethods ?? [
			'GET',
			'POST',
			'PUT',
			'PATCH',
			'DELETE',
			'OPTIONS',
		],
		allowedHeaders: config.allowedHeaders ?? ['*'],
		allowCredentials: config.allowCredentials ?? false,
	}
}

export default class Server {
	private router = Router({
		ignoreTrailingSlash: true,
		maxParamLength: 1024,
	})

	private httpServer: ReturnType<typeof createHttpServer> | null = null
	private port: number
	private host: string
	private cors: NormalizedCorsOptions | null
	private on404: ServerOptions['on404']
	private onError: ServerOptions['onError']
	private _endpoints: EndpointInfo[] = []

	constructor(options: ServerOptions = {}) {
		this.port = options.port ?? DEFAULT_PORT
		this.host = options.host ?? DEFAULT_HOST
		this.cors = normalizeCors(options.cors)
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
			async (
				request: IncomingMessage,
				reply: ServerResponse,
				params: Record<string, string | undefined> | undefined,
			) => {
				try {
					const routeParams = params ?? {}
					const query = parseQuery(request.url)
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

					const output = await handler(
						routeParams,
						query,
						body,
						request.headers,
					)

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

	/**
	 * Register a raw handler that gets direct access to the HTTP request/response.
	 * Use for streaming endpoints (SSE, WebSocket upgrades, file downloads).
	 */
	registerRaw(method: HttpMethod, path: string, handler: RawHandler): this {
		this.router.on(method, path, (req, res, params) => {
			const routeParams: Record<string, string> = {}
			if (params) {
				for (const [key, value] of Object.entries(params)) {
					if (value !== undefined) {
						routeParams[key] = value
					}
				}
			}
			handler(req, res, routeParams)
		})
		this._endpoints.push({ method, path, schemas: {} })
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
				if (this.cors) {
					const origin = req.headers.origin
					const headers: Record<string, string> = {}

					if (origin) {
						if (this.cors.allowedOrigins.includes('*')) {
							headers['Access-Control-Allow-Origin'] = this.cors
								.allowCredentials
								? origin
								: '*'
						} else if (this.cors.allowedOrigins.includes(origin)) {
							headers['Access-Control-Allow-Origin'] = origin
						}
					}

					if (this.cors.allowCredentials) {
						headers['Access-Control-Allow-Credentials'] = 'true'
					}

					if (req.method === 'OPTIONS') {
						headers['Access-Control-Allow-Methods'] =
							this.cors.allowedMethods.join(', ')

						const requestedHeaders =
							req.headers['access-control-request-headers']
						if (requestedHeaders) {
							const allowedHeaders = requestedHeaders
								.split(',')
								.map((header) => header.trim().toLowerCase())
								.filter(
									(header) =>
										this.cors!.allowedHeaders.includes('*') ||
										this.cors!.allowedHeaders.includes(header),
								)
							if (allowedHeaders.length > 0) {
								headers['Access-Control-Allow-Headers'] =
									allowedHeaders.join(', ')
							}
						}

						res.writeHead(204, headers)
						res.end()
						return
					}

					for (const [name, value] of Object.entries(headers)) {
						res.setHeader(name, value)
					}
				}

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
