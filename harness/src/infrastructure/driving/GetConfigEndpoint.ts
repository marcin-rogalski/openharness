import type { EndpointHandler } from '@openharness/tempo'
import { Endpoint } from '@openharness/tempo'
import type { GetConfigUseCasePort } from '@/application/ports/usecases/GetConfigUseCasePort'
import { GetConfigResponseDto } from '@/infrastructure/dtos/ConfigDto'

type Schemas = {
	response: typeof GetConfigResponseDto
}

export default class GetConfigEndpoint extends Endpoint<
	'/api/config',
	Schemas,
	EndpointHandler<Schemas>
> {
	constructor(private readonly usecase: GetConfigUseCasePort) {
		super(
			'GET',
			'/api/config',
			{
				response: GetConfigResponseDto,
			},
			async () => this.usecase.handle(),
		)
	}
}
