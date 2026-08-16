import { listProjectsEndpoint } from '@openharness/contracts'
import type { EndpointHandler } from '@openharness/tempo'
import { Endpoint } from '@openharness/tempo'
import type { ListProjectsUseCasePort } from '@/application/ports/usecases/ListProjectsUseCasePort'

type Schemas = {
	response: (typeof listProjectsEndpoint)['response']
}

export default class ListProjectsEndpoint extends Endpoint<
	(typeof listProjectsEndpoint)['path'],
	Schemas,
	EndpointHandler<Schemas>
> {
	constructor(private readonly usecase: ListProjectsUseCasePort) {
		super(
			listProjectsEndpoint.method,
			listProjectsEndpoint.path,
			{
				response: listProjectsEndpoint.response,
			},
			async () => this.usecase.handle(),
		)
	}
}
