import { updateAgentEndpoint } from '@openharness/contracts'
import type { EndpointHandler } from '@openharness/tempo'
import { Endpoint } from '@openharness/tempo'
import type { AgentUsecasePort } from '@/application/ports/usecases/AgentUsecasePort'

type Schemas = {
	body: (typeof updateAgentEndpoint)['body']
	response: (typeof updateAgentEndpoint)['response']
}

export default class UpdateAgentEndpoint extends Endpoint<
	(typeof updateAgentEndpoint)['path'],
	Schemas,
	EndpointHandler<Schemas>
> {
	constructor(private readonly usecase: AgentUsecasePort) {
		super(
			updateAgentEndpoint.method,
			updateAgentEndpoint.path,
			{
				body: updateAgentEndpoint.body,
				response: updateAgentEndpoint.response,
			},
			async (input) => this.usecase.update(input),
		)
	}
}
