import { listSessionsEndpoint } from '@openharness/contracts'
import type { EndpointHandler } from '@openharness/tempo'
import { Endpoint } from '@openharness/tempo'
import type { ListSessionsUseCasePort } from '@/application/ports/usecases/ListSessionsUseCasePort'

type Schemas = {
	params: (typeof listSessionsEndpoint)['params']
	response: (typeof listSessionsEndpoint)['response']
}

export default class ListSessionsEndpoint extends Endpoint<
	(typeof listSessionsEndpoint)['path'],
	Schemas,
	EndpointHandler<Schemas>
> {
	constructor(private readonly usecase: ListSessionsUseCasePort) {
		super(
			listSessionsEndpoint.method,
			listSessionsEndpoint.path,
			{
				params: listSessionsEndpoint.params,
				response: listSessionsEndpoint.response,
			},
			async (input) => this.usecase.handle(input),
		)
	}
}
