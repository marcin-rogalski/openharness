import { deleteProjectEndpoint } from '@openharness/contracts'
import type { EndpointHandler } from '@openharness/tempo'
import { Endpoint } from '@openharness/tempo'
import type { DeleteProjectUseCasePort } from '@/application/ports/usecases/DeleteProjectUseCasePort'

type Schemas = {
	params: (typeof deleteProjectEndpoint)['params']
	response: (typeof deleteProjectEndpoint)['response']
}

export default class DeleteProjectEndpoint extends Endpoint<
	(typeof deleteProjectEndpoint)['path'],
	Schemas,
	EndpointHandler<Schemas>
> {
	constructor(private readonly usecase: DeleteProjectUseCasePort) {
		super(
			deleteProjectEndpoint.method,
			deleteProjectEndpoint.path,
			{
				params: deleteProjectEndpoint.params,
				response: deleteProjectEndpoint.response,
			},
			async (input) => this.usecase.handle(input),
		)
	}
}
