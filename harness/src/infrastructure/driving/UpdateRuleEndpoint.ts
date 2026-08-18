import { updateRuleEndpoint } from '@openharness/contracts'
import type { EndpointHandler } from '@openharness/tempo'
import { Endpoint } from '@openharness/tempo'
import type { RuleUsecasePort } from '@/application/ports/usecases/RuleUsecasePort'

type Schemas = {
	body: (typeof updateRuleEndpoint)['body']
	response: (typeof updateRuleEndpoint)['response']
}

export default class UpdateRuleEndpoint extends Endpoint<
	(typeof updateRuleEndpoint)['path'],
	Schemas,
	EndpointHandler<Schemas>
> {
	constructor(private readonly usecase: RuleUsecasePort) {
		super(
			updateRuleEndpoint.method,
			updateRuleEndpoint.path,
			{
				body: updateRuleEndpoint.body,
				response: updateRuleEndpoint.response,
			},
			async (input) => this.usecase.update(input),
		)
	}
}
