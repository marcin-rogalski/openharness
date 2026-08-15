import type { z } from 'zod'

/**
 * Thrown when input or output validation fails.
 */
export class ValidationError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'ValidationError'
	}
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

export type EndpointSchemas = {
	params?: z.ZodTypeAny
	body?: z.ZodTypeAny
	query?: z.ZodTypeAny
	headers?: z.ZodTypeAny
	response?: z.ZodTypeAny
}

/**
 * Input type inferred from schemas.
 * Only fields that have schemas are included.
 */
export type HandlerInput<S extends EndpointSchemas> = ('params' extends keyof S
	? S['params'] extends z.ZodTypeAny
		? z.infer<S['params']>
		: Record<never, never>
	: Record<never, never>) &
	('body' extends keyof S
		? S['body'] extends z.ZodTypeAny
			? z.infer<S['body']>
			: Record<never, never>
		: Record<never, never>) &
	('query' extends keyof S
		? S['query'] extends z.ZodTypeAny
			? z.infer<S['query']>
			: Record<never, never>
		: Record<never, never>) &
	('headers' extends keyof S
		? S['headers'] extends z.ZodTypeAny
			? z.infer<S['headers']>
			: Record<never, never>
		: Record<never, never>)

/**
 * Output type inferred from the response schema, or void if no response schema.
 */
export type HandlerOutput<S extends EndpointSchemas> =
	'response' extends keyof S
		? S['response'] extends z.ZodTypeAny
			? z.infer<S['response']>
			: unknown
		: unknown

/**
 * Handler function type.
 */
export type EndpointHandler<S extends EndpointSchemas> = (
	input: HandlerInput<S>,
) => Promise<HandlerOutput<S>>

/**
 * Metadata about a registered endpoint, used for introspection / contract generation.
 */
export interface EndpointInfo {
	method: HttpMethod
	path: string
	schemas: EndpointSchemas
}
