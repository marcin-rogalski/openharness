import { listPermissionsEndpoint } from '@openharness/contracts'
import type { EndpointHandler } from '@openharness/tempo'
import { Endpoint } from '@openharness/tempo'
import type { PermissionUsecasePort } from '@/application/ports/usecases/PermissionUsecasePort'

type Schemas = {
	response: (typeof listPermissionsEndpoint)['response']
}

export default class ListPermissionsEndpoint extends Endpoint<
	(typeof listPermissionsEndpoint)['path'],
	Schemas,
	EndpointHandler<Schemas>
> {
	constructor(private readonly usecase: PermissionUsecasePort) {
		super(
			listPermissionsEndpoint.method,
			listPermissionsEndpoint.path,
			{
				response: listPermissionsEndpoint.response,
			},
			async () => this.usecase.list(),
		)
	}
}
