import { createSessionEndpoint } from '@openharness/contracts'
import type { EndpointHandler } from '@openharness/tempo'
import { Endpoint } from '@openharness/tempo'
import type { CreateSessionUseCasePort } from '@/application/ports/usecases/CreateSessionUseCasePort'

type Schemas = {
	params: (typeof createSessionEndpoint)['params']
	response: (typeof createSessionEndpoint)['response']
}

export default class CreateSessionEndpoint extends Endpoint<
	(typeof createSessionEndpoint)['path'],
	Schemas,
	EndpointHandler<Schemas>
> {
	constructor(private readonly usecase: CreateSessionUseCasePort) {
		super(
			createSessionEndpoint.method,
			createSessionEndpoint.path,
			{
				params: createSessionEndpoint.params,
				response: createSessionEndpoint.response,
			},
			async (input) => this.usecase.handle(input),
		)
	}
}
