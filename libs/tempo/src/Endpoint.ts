import type {
	EndpointHandler,
	EndpointInfo,
	EndpointSchemas,
	HandlerInput,
	HttpMethod,
} from './types'
import { ValidationError } from './types'

/**
 * Framework-agnostic endpoint definition.
 *
 * Accepts handler in the constructor so TypeScript can infer types from schemas.
 */
export default class Endpoint<
	TPath extends string,
	TSchemas extends EndpointSchemas,
	THandler extends EndpointHandler<TSchemas>,
> {
	readonly method: HttpMethod
	readonly path: TPath
	private readonly _schemas: TSchemas
	private readonly _handler: THandler

	constructor(
		method: HttpMethod,
		path: TPath,
		schemas: TSchemas,
		handler: THandler,
	) {
		this.method = method
		this.path = path
		this._schemas = schemas
		this._handler = handler
	}

	/**
	 * Convert this endpoint to framework-agnostic info.
	 * Used by the Server for contract generation.
	 */
	toInfo(): EndpointInfo {
		return {
			method: this.method,
			path: this.path,
			schemas: this._schemas,
		}
	}

	/**
	 * Create a framework-agnostic handler function.
	 * Validates input, calls handler, validates output.
	 * Returns a function that can be used by any HTTP framework.
	 */
	createHandler(): (
		params: unknown,
		query: unknown,
		body: unknown,
		headers: unknown,
	) => Promise<unknown> {
		return async (
			params: unknown,
			query: unknown,
			body: unknown,
			headers: unknown,
		) => {
			const input: Record<string, unknown> = {}

			if (this._schemas.params) {
				try {
					const result = this._schemas.params.parse(params)
					Object.assign(input, result)
				} catch (err) {
					throw new ValidationError(`Params validation failed: ${err}`)
				}
			}

			if (this._schemas.body) {
				try {
					const result = this._schemas.body.parse(body)
					Object.assign(input, result)
				} catch (err) {
					throw new ValidationError(`Body validation failed: ${err}`)
				}
			}

			if (this._schemas.query) {
				try {
					const result = this._schemas.query.parse(query)
					Object.assign(input, result)
				} catch (err) {
					throw new ValidationError(`Query validation failed: ${err}`)
				}
			}

			if (this._schemas.headers) {
				try {
					const result = this._schemas.headers.parse(headers)
					Object.assign(input, result)
				} catch (err) {
					throw new ValidationError(`Headers validation failed: ${err}`)
				}
			}

			const output = await this._handler(input as HandlerInput<TSchemas>)

			if (this._schemas.response) {
				try {
					this._schemas.response.parse(output)
				} catch (err) {
					throw new ValidationError(`Response validation failed: ${err}`)
				}
			}

			return output
		}
	}
}
