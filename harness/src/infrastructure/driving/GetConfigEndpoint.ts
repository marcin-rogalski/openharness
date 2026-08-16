import { getConfigEndpoint } from '@openharness/contracts'
import type { EndpointHandler } from '@openharness/tempo'
import { Endpoint } from '@openharness/tempo'
import type { GetConfigUseCasePort } from '@/application/ports/usecases/GetConfigUseCasePort'

type Schemas = {
	response: (typeof getConfigEndpoint)['response']
}

export default class GetConfigEndpoint extends Endpoint<
	(typeof getConfigEndpoint)['path'],
	Schemas,
	EndpointHandler<Schemas>
> {
	constructor(private readonly usecase: GetConfigUseCasePort) {
		super(
			getConfigEndpoint.method,
			getConfigEndpoint.path,
			{
				response: getConfigEndpoint.response,
			},
			async () => this.usecase.handle(),
		)
	}
}
