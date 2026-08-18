import { listAgentsEndpoint } from '@openharness/contracts'
import type { EndpointHandler } from '@openharness/tempo'
import { Endpoint } from '@openharness/tempo'
import type { AgentUsecasePort } from '@/application/ports/usecases/AgentUsecasePort'

type Schemas = {
	response: (typeof listAgentsEndpoint)['response']
}

export default class ListAgentsEndpoint extends Endpoint<
	(typeof listAgentsEndpoint)['path'],
	Schemas,
	EndpointHandler<Schemas>
> {
	constructor(private readonly usecase: AgentUsecasePort) {
		super(
			listAgentsEndpoint.method,
			listAgentsEndpoint.path,
			{
				response: listAgentsEndpoint.response,
			},
			async () => this.usecase.list(),
		)
	}
}
