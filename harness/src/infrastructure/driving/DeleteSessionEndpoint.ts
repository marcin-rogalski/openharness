import { deleteSessionEndpoint } from '@openharness/contracts'
import type { EndpointHandler } from '@openharness/tempo'
import { Endpoint } from '@openharness/tempo'
import type { DeleteSessionUseCasePort } from '@/application/ports/usecases/DeleteSessionUseCasePort'

type Schemas = {
	params: (typeof deleteSessionEndpoint)['params']
	response: (typeof deleteSessionEndpoint)['response']
}

export default class DeleteSessionEndpoint extends Endpoint<
	(typeof deleteSessionEndpoint)['path'],
	Schemas,
	EndpointHandler<Schemas>
> {
	constructor(private readonly usecase: DeleteSessionUseCasePort) {
		super(
			deleteSessionEndpoint.method,
			deleteSessionEndpoint.path,
			{
				params: deleteSessionEndpoint.params,
				response: deleteSessionEndpoint.response,
			},
			async (input) => this.usecase.handle(input),
		)
	}
}
