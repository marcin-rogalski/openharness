// Usecases — one business operation each
// Takes driven adapters, returns usecase ports.

import type { ListProjectsUseCasePort } from '@/application/ports/usecases/ListProjectsUseCasePort'
import type { SendProjectMessageUseCasePort } from '@/application/ports/usecases/SendProjectMessageUseCasePort'
import ListProjectsUsecase from '@/application/usecases/ListProjectsUsecase'
import SendProjectMessageUsecase from '@/application/usecases/SendProjectMessageUsecase'
import type composeDriven from './composedDriven'

type Driven = Awaited<ReturnType<typeof composeDriven>>

export default function composeUsecases(driven: Driven): {
	listProjects: ListProjectsUseCasePort
	sendProjectMessage: SendProjectMessageUseCasePort
} {
	return {
		listProjects: new ListProjectsUsecase(driven.projectRepository),
		sendProjectMessage: new SendProjectMessageUsecase(
			driven.projectRepository,
			driven.agentRuntime,
		),
	}
}
