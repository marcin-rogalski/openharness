import type { z } from 'zod'

export type HttpMethod =
	| 'GET'
	| 'POST'
	| 'PUT'
	| 'PATCH'
	| 'DELETE'
	| 'OPTIONS'
	| 'HEAD'

export interface EndpointSchema<
	Params extends z.ZodType = z.ZodType,
	Query extends z.ZodType = z.ZodType,
	Body extends z.ZodType = z.ZodType,
	Response extends z.ZodType = z.ZodType,
> {
	method: HttpMethod
	path: string
	params?: Params
	query?: Query
	body?: Body
	response?: Response
}

export type ApiSchema = Record<string, EndpointSchema>

export type FetchFunction = (
	url: string,
	init?: RequestInit,
) => Promise<Response>

export interface FetchClientOptions {
	baseUrl?: string
	headers?: Record<string, string>
	fetch?: FetchFunction
}

type HasSchema<T> = [T] extends [never]
	? false
	: [T] extends [z.ZodType]
		? true
		: false

type InputOf<T> = HasSchema<T> extends true ? z.input<T> : undefined

export type RequestInput<T extends EndpointSchema> = {
	params?: InputOf<NonNullable<T['params']>>
	query?: InputOf<NonNullable<T['query']>>
} & (HasSchema<NonNullable<T['body']>> extends true
	? { body: InputOf<NonNullable<T['body']>> }
	: { body?: undefined })

export type ResponseOf<T extends EndpointSchema> =
	HasSchema<NonNullable<T['response']>> extends true
		? z.output<NonNullable<T['response']>>
		: unknown
