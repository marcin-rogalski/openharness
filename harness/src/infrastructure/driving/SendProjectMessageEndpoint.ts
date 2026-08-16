import type { EndpointHandler } from '@openharness/tempo'
import { Endpoint } from '@openharness/tempo'
import type { SendProjectMessageUseCasePort } from '@/application/ports/usecases/SendProjectMessageUseCasePort'
import {
	SendMessageBodyDto,
	SendMessageParamsDto,
	SendMessageResponseDto,
} from '@/infrastructure/dtos/SendMessageDto'

type Schemas = {
	params: typeof SendMessageParamsDto
	body: typeof SendMessageBodyDto
	response: typeof SendMessageResponseDto
}

export default class SendProjectMessageEndpoint extends Endpoint<
	'/api/projects/:projectId/messages',
	Schemas,
	EndpointHandler<Schemas>
> {
	constructor(private readonly usecase: SendProjectMessageUseCasePort) {
		super(
			'POST',
			'/api/projects/:projectId/messages',
			{
				params: SendMessageParamsDto,
				body: SendMessageBodyDto,
				response: SendMessageResponseDto,
			},
			async (input) => this.usecase.handle(input),
		)
	}
}
