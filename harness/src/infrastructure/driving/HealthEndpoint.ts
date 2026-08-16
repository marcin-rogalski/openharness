import type { EndpointHandler } from '@openharness/tempo'
import { Endpoint } from '@openharness/tempo'
import { HealthDto } from '@/infrastructure/dtos/ConfigDto'

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
