import type { UpdateConfigUseCasePort } from '@/application/ports/usecases/UpdateConfigUseCasePort'
import {
	UpdateConfigBodyDto,
	UpdateConfigResponseDto,
} from '@/infrastructure/dtos/ConfigDto'
import { Endpoint } from '@openharness/tempo'
import type { EndpointHandler } from '@openharness/tempo'

type Schemas = {
	body: typeof UpdateConfigBodyDto
	response: typeof UpdateConfigResponseDto
}

export default class UpdateConfigEndpoint extends Endpoint<
	'/api/config',
	Schemas,
	EndpointHandler<Schemas>
> {
	constructor(private readonly usecase: UpdateConfigUseCasePort) {
		super(
			'PUT',
			'/api/config',
			{
				body: UpdateConfigBodyDto,
				response: UpdateConfigResponseDto,
			},
			async (input) => this.usecase.handle(input),
		)
	}
}
