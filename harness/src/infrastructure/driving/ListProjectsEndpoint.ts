import type { ListProjectsUseCasePort } from '@/application/ports/usecases/ListProjectsUseCasePort'
import { ListProjectsResponseDto } from '@/infrastructure/dtos/ListProjectsDto'
import { Endpoint } from '@openharness/tempo'
import type { EndpointHandler } from '@openharness/tempo'

type Schemas = {
	response: typeof ListProjectsResponseDto
}

export default class ListProjectsEndpoint extends Endpoint<
	'/api/projects',
	Schemas,
	EndpointHandler<Schemas>
> {
	constructor(private readonly usecase: ListProjectsUseCasePort) {
		super(
			'GET',
			'/api/projects',
			{
				response: ListProjectsResponseDto,
			},
			async () => this.usecase.handle(),
		)
	}
}
