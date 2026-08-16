import { sendMessageEndpoint } from '@openharness/contracts'
import type { EndpointHandler } from '@openharness/tempo'
import { Endpoint } from '@openharness/tempo'
import type { SendProjectMessageUseCasePort } from '@/application/ports/usecases/SendProjectMessageUseCasePort'

type Schemas = {
	params: (typeof sendMessageEndpoint)['params']
	body: (typeof sendMessageEndpoint)['body']
	response: (typeof sendMessageEndpoint)['response']
}

export default class SendProjectMessageEndpoint extends Endpoint<
	(typeof sendMessageEndpoint)['path'],
	Schemas,
	EndpointHandler<Schemas>
> {
	constructor(private readonly usecase: SendProjectMessageUseCasePort) {
		super(
			sendMessageEndpoint.method,
			sendMessageEndpoint.path,
			{
				params: sendMessageEndpoint.params,
				body: sendMessageEndpoint.body,
				response: sendMessageEndpoint.response,
			},
			async (input) => this.usecase.handle(input),
		)
	}
}
