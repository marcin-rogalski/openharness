import { updatePermissionEndpoint } from '@openharness/contracts'
import type { EndpointHandler } from '@openharness/tempo'
import { Endpoint } from '@openharness/tempo'
import type { PermissionUsecasePort } from '@/application/ports/usecases/PermissionUsecasePort'

type Schemas = {
	body: (typeof updatePermissionEndpoint)['body']
	response: (typeof updatePermissionEndpoint)['response']
}

export default class UpdatePermissionEndpoint extends Endpoint<
	(typeof updatePermissionEndpoint)['path'],
	Schemas,
	EndpointHandler<Schemas>
> {
	constructor(private readonly usecase: PermissionUsecasePort) {
		super(
			updatePermissionEndpoint.method,
			updatePermissionEndpoint.path,
			{
				body: updatePermissionEndpoint.body,
				response: updatePermissionEndpoint.response,
			},
			async (input) => this.usecase.update(input),
		)
	}
}
