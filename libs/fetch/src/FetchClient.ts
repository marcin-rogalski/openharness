import { FetchApiError } from './FetchApiError'
import type {
	ApiSchema,
	FetchClientOptions,
	FetchFunction,
	RequestInput,
	ResponseOf,
} from './types'

export class FetchClient<S extends ApiSchema> {
	private readonly api: S
	private readonly baseUrl: string | undefined
	private readonly headers: Record<string, string> | undefined
	private readonly fetchImpl: FetchFunction

	constructor(api: S, options: FetchClientOptions = {}) {
		this.api = api
		this.baseUrl = options.baseUrl
		this.headers = options.headers
		this.fetchImpl =
			options.fetch ?? ((url, init) => globalThis.fetch(url, init))
	}

	async request<K extends keyof S & string>(
		operation: K,
		input?: RequestInput<S[K]>,
	): Promise<ResponseOf<S[K]>> {
		const endpoint = this.api[operation]
		const params = (
			endpoint.params ? endpoint.params.parse(input?.params ?? {}) : {}
		) as Record<string, unknown>
		const path = this.resolvePath(endpoint.path, params)
		const query = endpoint.query
			? (endpoint.query.parse(input?.query ?? {}) as Record<string, unknown>)
			: undefined
		const body = endpoint.body
			? endpoint.body.parse(input?.body as never)
			: undefined
		const url = this.withQuery(this.joinUrl(path), query)

		const response = await this.fetchImpl(url, {
			method: endpoint.method,
			headers: {
				'Content-Type': 'application/json',
				...this.headers,
			},
			body: body === undefined ? undefined : JSON.stringify(body),
		})

		if (!response.ok) {
			throw new FetchApiError(
				response.status,
				await this.errorMessage(response),
			)
		}

		let payload: unknown
		try {
			payload = await response.json()
		} catch {
			payload = undefined
		}

		return (
			endpoint.response ? endpoint.response.parse(payload) : payload
		) as ResponseOf<S[K]>
	}

	private joinUrl(path: string): string {
		if (!this.baseUrl) {
			return path
		}
		const suffix = path.startsWith('/') ? path : `/${path}`
		return `${this.baseUrl.replace(/\/+$/, '')}${suffix}`
	}

	private resolvePath(path: string, params: Record<string, unknown>): string {
		return path.replace(/:([A-Za-z0-9_]+)/g, (_match, name: string) => {
			const value = params[name]
			if (value === undefined || value === null) {
				throw new Error(`Missing path parameter: ${name}`)
			}
			return encodeURIComponent(String(value))
		})
	}

	private withQuery(
		url: string,
		query: Record<string, unknown> | undefined,
	): string {
		if (!query) {
			return url
		}
		const search = new URLSearchParams()
		for (const [key, value] of Object.entries(query)) {
			if (value === null || value === undefined) {
				continue
			}
			if (Array.isArray(value)) {
				for (const item of value) {
					search.append(key, String(item))
				}
			} else {
				search.append(key, String(value))
			}
		}
		const queryString = search.toString()
		return queryString ? `${url}?${queryString}` : url
	}

	private async errorMessage(response: Response): Promise<string> {
		const fallback = `Request failed with status ${response.status}`
		try {
			const payload = await response.json()
			if (
				payload &&
				typeof payload === 'object' &&
				typeof (payload as { error?: unknown }).error === 'string'
			) {
				return (payload as { error: string }).error
			}
		} catch {
			// The error body is not JSON.
		}
		return fallback
	}
}
