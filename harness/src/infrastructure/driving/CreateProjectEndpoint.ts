import { createProjectEndpoint } from '@openharness/contracts'
import type { EndpointHandler } from '@openharness/tempo'
import { Endpoint } from '@openharness/tempo'
import type { CreateProjectUseCasePort } from '@/application/ports/usecases/CreateProjectUseCasePort'

type Schemas = {
	body: (typeof createProjectEndpoint)['body']
	response: (typeof createProjectEndpoint)['response']
}

export default class CreateProjectEndpoint extends Endpoint<
	(typeof createProjectEndpoint)['path'],
	Schemas,
	EndpointHandler<Schemas>
> {
	constructor(private readonly usecase: CreateProjectUseCasePort) {
		super(
			createProjectEndpoint.method,
			createProjectEndpoint.path,
			{
				body: createProjectEndpoint.body,
				response: createProjectEndpoint.response,
			},
			async (input) => this.usecase.handle(input),
		)
	}
}
