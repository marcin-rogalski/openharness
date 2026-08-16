import { updateConfigEndpoint } from '@openharness/contracts'
import type { EndpointHandler } from '@openharness/tempo'
import { Endpoint } from '@openharness/tempo'
import type { UpdateConfigUseCasePort } from '@/application/ports/usecases/UpdateConfigUseCasePort'

type Schemas = {
	body: (typeof updateConfigEndpoint)['body']
	response: (typeof updateConfigEndpoint)['response']
}

export default class UpdateConfigEndpoint extends Endpoint<
	(typeof updateConfigEndpoint)['path'],
	Schemas,
	EndpointHandler<Schemas>
> {
	constructor(private readonly usecase: UpdateConfigUseCasePort) {
		super(
			updateConfigEndpoint.method,
			updateConfigEndpoint.path,
			{
				body: updateConfigEndpoint.body,
				response: updateConfigEndpoint.response,
			},
			async (input) => this.usecase.handle(input),
		)
	}
}
