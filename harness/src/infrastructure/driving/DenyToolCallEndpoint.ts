import { denyToolCallEndpoint } from '@openharness/contracts'
import type { EndpointHandler } from '@openharness/tempo'
import { Endpoint } from '@openharness/tempo'
import type { DenyToolCallUseCasePort } from '@/application/ports/usecases/DenyToolCallUseCasePort'

type Schemas = {
	params: (typeof denyToolCallEndpoint)['params']
	body: (typeof denyToolCallEndpoint)['body']
	response: (typeof denyToolCallEndpoint)['response']
}

export default class DenyToolCallEndpoint extends Endpoint<
	(typeof denyToolCallEndpoint)['path'],
	Schemas,
	EndpointHandler<Schemas>
> {
	constructor(private readonly usecase: DenyToolCallUseCasePort) {
		super(
			denyToolCallEndpoint.method,
			denyToolCallEndpoint.path,
			{
				params: denyToolCallEndpoint.params,
				body: denyToolCallEndpoint.body,
				response: denyToolCallEndpoint.response,
			},
			async (input) => this.usecase.handle(input),
		)
	}
}
