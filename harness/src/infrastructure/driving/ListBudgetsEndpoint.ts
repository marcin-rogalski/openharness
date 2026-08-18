import { listBudgetsEndpoint } from '@openharness/contracts'
import type { EndpointHandler } from '@openharness/tempo'
import { Endpoint } from '@openharness/tempo'
import type { BudgetUsecasePort } from '@/application/ports/usecases/BudgetUsecasePort'

type Schemas = {
	response: (typeof listBudgetsEndpoint)['response']
}

export default class ListBudgetsEndpoint extends Endpoint<
	(typeof listBudgetsEndpoint)['path'],
	Schemas,
	EndpointHandler<Schemas>
> {
	constructor(private readonly usecase: BudgetUsecasePort) {
		super(
			listBudgetsEndpoint.method,
			listBudgetsEndpoint.path,
			{
				response: listBudgetsEndpoint.response,
			},
			async () => this.usecase.list(),
		)
	}
}
