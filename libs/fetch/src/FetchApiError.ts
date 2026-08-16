export class FetchApiError extends Error {
	readonly status: number

	constructor(status: number, message: string) {
		super(message)
		this.name = 'FetchApiError'
		this.status = status
	}
}
