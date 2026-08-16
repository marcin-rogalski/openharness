import { HealthDto } from '@/infrastructure/dtos/ConfigDto'
import { Endpoint } from '@openharness/tempo'
import type { EndpointHandler } from '@openharness/tempo'

type Schemas = {
	response: typeof HealthDto
}

export default class HealthEndpoint extends Endpoint<
	'/api/health',
	Schemas,
	EndpointHandler<Schemas>
> {
	constructor() {
		super(
			'GET',
			'/api/health',
			{
				response: HealthDto,
			},
			async () => ({ status: 'ok' }),
		)
	}
}
