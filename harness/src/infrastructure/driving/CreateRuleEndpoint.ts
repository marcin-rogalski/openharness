import { createRuleEndpoint } from '@openharness/contracts'
import type { EndpointHandler } from '@openharness/tempo'
import { Endpoint } from '@openharness/tempo'
import type { RuleUsecasePort } from '@/application/ports/usecases/RuleUsecasePort'

type Schemas = {
	body: (typeof createRuleEndpoint)['body']
	response: (typeof createRuleEndpoint)['response']
}

export default class CreateRuleEndpoint extends Endpoint<
	(typeof createRuleEndpoint)['path'],
	Schemas,
	EndpointHandler<Schemas>
> {
	constructor(private readonly usecase: RuleUsecasePort) {
		super(
			createRuleEndpoint.method,
			createRuleEndpoint.path,
			{
				body: createRuleEndpoint.body,
				response: createRuleEndpoint.response,
			},
			async (input) => this.usecase.create(input),
		)
	}
}
