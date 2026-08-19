import { stopSessionEndpoint } from '@openharness/contracts'
import type { EndpointHandler } from '@openharness/tempo'
import { Endpoint } from '@openharness/tempo'
import type { StopSessionUseCasePort } from '@/application/ports/usecases/StopSessionUseCasePort'

type Schemas = {
	params: (typeof stopSessionEndpoint)['params']
	response: (typeof stopSessionEndpoint)['response']
}

export default class StopSessionEndpoint extends Endpoint<
	(typeof stopSessionEndpoint)['path'],
	Schemas,
	EndpointHandler<Schemas>
> {
	constructor(private readonly usecase: StopSessionUseCasePort) {
		super(
			stopSessionEndpoint.method,
			stopSessionEndpoint.path,
			{
				params: stopSessionEndpoint.params,
				response: stopSessionEndpoint.response,
			},
			async (input) => this.usecase.handle(input),
		)
	}
}
