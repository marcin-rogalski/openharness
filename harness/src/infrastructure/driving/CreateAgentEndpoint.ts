import { createAgentEndpoint } from '@openharness/contracts'
import type { EndpointHandler } from '@openharness/tempo'
import { Endpoint } from '@openharness/tempo'
import type { AgentUsecasePort } from '@/application/ports/usecases/AgentUsecasePort'

type Schemas = {
	body: (typeof createAgentEndpoint)['body']
	response: (typeof createAgentEndpoint)['response']
}

export default class CreateAgentEndpoint extends Endpoint<
	(typeof createAgentEndpoint)['path'],
	Schemas,
	EndpointHandler<Schemas>
> {
	constructor(private readonly usecase: AgentUsecasePort) {
		super(
			createAgentEndpoint.method,
			createAgentEndpoint.path,
			{
				body: createAgentEndpoint.body,
				response: createAgentEndpoint.response,
			},
			async (input) => this.usecase.create(input),
		)
	}
}
