import { createBudgetEndpoint } from '@openharness/contracts'
import type { EndpointHandler } from '@openharness/tempo'
import { Endpoint } from '@openharness/tempo'
import type { BudgetUsecasePort } from '@/application/ports/usecases/BudgetUsecasePort'

type Schemas = {
	body: (typeof createBudgetEndpoint)['body']
	response: (typeof createBudgetEndpoint)['response']
}

export default class CreateBudgetEndpoint extends Endpoint<
	(typeof createBudgetEndpoint)['path'],
	Schemas,
	EndpointHandler<Schemas>
> {
	constructor(private readonly usecase: BudgetUsecasePort) {
		super(
			createBudgetEndpoint.method,
			createBudgetEndpoint.path,
			{
				body: createBudgetEndpoint.body,
				response: createBudgetEndpoint.response,
			},
			async (input) => this.usecase.create(input),
		)
	}
}
