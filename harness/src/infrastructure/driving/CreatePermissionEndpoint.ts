import { createPermissionEndpoint } from '@openharness/contracts'
import type { EndpointHandler } from '@openharness/tempo'
import { Endpoint } from '@openharness/tempo'
import type { PermissionUsecasePort } from '@/application/ports/usecases/PermissionUsecasePort'

type Schemas = {
	body: (typeof createPermissionEndpoint)['body']
	response: (typeof createPermissionEndpoint)['response']
}

export default class CreatePermissionEndpoint extends Endpoint<
	(typeof createPermissionEndpoint)['path'],
	Schemas,
	EndpointHandler<Schemas>
> {
	constructor(private readonly usecase: PermissionUsecasePort) {
		super(
			createPermissionEndpoint.method,
			createPermissionEndpoint.path,
			{
				body: createPermissionEndpoint.body,
				response: createPermissionEndpoint.response,
			},
			async (input) => this.usecase.create(input),
		)
	}
}
