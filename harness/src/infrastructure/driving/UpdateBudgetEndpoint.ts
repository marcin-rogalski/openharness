import { updateBudgetEndpoint } from '@openharness/contracts'
import type { EndpointHandler } from '@openharness/tempo'
import { Endpoint } from '@openharness/tempo'
import type { BudgetUsecasePort } from '@/application/ports/usecases/BudgetUsecasePort'

type Schemas = {
	body: (typeof updateBudgetEndpoint)['body']
	response: (typeof updateBudgetEndpoint)['response']
}

export default class UpdateBudgetEndpoint extends Endpoint<
	(typeof updateBudgetEndpoint)['path'],
	Schemas,
	EndpointHandler<Schemas>
> {
	constructor(private readonly usecase: BudgetUsecasePort) {
		super(
			updateBudgetEndpoint.method,
			updateBudgetEndpoint.path,
			{
				body: updateBudgetEndpoint.body,
				response: updateBudgetEndpoint.response,
			},
			async (input) => this.usecase.update(input),
		)
	}
}
