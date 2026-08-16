import { healthEndpoint } from '@openharness/contracts'
import type { EndpointHandler } from '@openharness/tempo'
import { Endpoint } from '@openharness/tempo'

type Schemas = {
	response: (typeof healthEndpoint)['response']
}

export default class HealthEndpoint extends Endpoint<
	(typeof healthEndpoint)['path'],
	Schemas,
	EndpointHandler<Schemas>
> {
	constructor() {
		super(
			healthEndpoint.method,
			healthEndpoint.path,
			{
				response: healthEndpoint.response,
			},
			async () => ({ status: 'ok' }),
		)
	}
}
