import { approveToolCallEndpoint } from '@openharness/contracts'
import type { EndpointHandler } from '@openharness/tempo'
import { Endpoint } from '@openharness/tempo'
import type { ApproveToolCallUseCasePort } from '@/application/ports/usecases/ApproveToolCallUseCasePort'

type Schemas = {
	params: (typeof approveToolCallEndpoint)['params']
	body: (typeof approveToolCallEndpoint)['body']
	response: (typeof approveToolCallEndpoint)['response']
}

export default class ApproveToolCallEndpoint extends Endpoint<
	(typeof approveToolCallEndpoint)['path'],
	Schemas,
	EndpointHandler<Schemas>
> {
	constructor(private readonly usecase: ApproveToolCallUseCasePort) {
		super(
			approveToolCallEndpoint.method,
			approveToolCallEndpoint.path,
			{
				params: approveToolCallEndpoint.params,
				body: approveToolCallEndpoint.body,
				response: approveToolCallEndpoint.response,
			},
			async (input) => this.usecase.handle(input),
		)
	}
}
