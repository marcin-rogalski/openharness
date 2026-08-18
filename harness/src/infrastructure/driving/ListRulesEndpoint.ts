import { listRulesEndpoint } from '@openharness/contracts'
import type { EndpointHandler } from '@openharness/tempo'
import { Endpoint } from '@openharness/tempo'
import type { RuleUsecasePort } from '@/application/ports/usecases/RuleUsecasePort'

type Schemas = {
	response: (typeof listRulesEndpoint)['response']
}

export default class ListRulesEndpoint extends Endpoint<
	(typeof listRulesEndpoint)['path'],
	Schemas,
	EndpointHandler<Schemas>
> {
	constructor(private readonly usecase: RuleUsecasePort) {
		super(
			listRulesEndpoint.method,
			listRulesEndpoint.path,
			{
				response: listRulesEndpoint.response,
			},
			async () => this.usecase.list(),
		)
	}
}
