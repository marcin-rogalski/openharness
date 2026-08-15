// Usecases — one business operation each
// Takes driven adapters, returns usecase ports.

import type { SendProjectMessageUseCasePort } from '@/application/ports/usecases/SendProjectMessageUseCasePort'
import SendProjectMessageUsecase from '@/application/usecases/SendProjectMessageUsecase'
import type composeDriven from './composedDriven'

type Driven = Awaited<ReturnType<typeof composeDriven>>

export default function composeUsecases(driven: Driven): {
	sendProjectMessage: SendProjectMessageUseCasePort
} {
	return {
		sendProjectMessage: new SendProjectMessageUsecase(
			driven.projectRepository,
			driven.agentRuntime,
		),
	}
}
