// Usecases — one business operation each
// Takes driven adapters, returns usecase ports.

import type { ApproveToolCallUseCasePort } from '@/application/ports/usecases/ApproveToolCallUseCasePort'
import type { DenyToolCallUseCasePort } from '@/application/ports/usecases/DenyToolCallUseCasePort'
import type { GetConfigUseCasePort } from '@/application/ports/usecases/GetConfigUseCasePort'
import type { ListProjectsUseCasePort } from '@/application/ports/usecases/ListProjectsUseCasePort'
import type { SendProjectMessageUseCasePort } from '@/application/ports/usecases/SendProjectMessageUseCasePort'
import type { UpdateConfigUseCasePort } from '@/application/ports/usecases/UpdateConfigUseCasePort'
import ApproveToolCallUsecase from '@/application/usecases/ApproveToolCallUsecase'
import DenyToolCallUsecase from '@/application/usecases/DenyToolCallUsecase'
import GetConfigUsecase from '@/application/usecases/GetConfigUsecase'
import ListProjectsUsecase from '@/application/usecases/ListProjectsUsecase'
import SendProjectMessageUsecase from '@/application/usecases/SendProjectMessageUsecase'
import UpdateConfigUsecase from '@/application/usecases/UpdateConfigUsecase'
import type composeDriven from './composedDriven'

type Driven = Awaited<ReturnType<typeof composeDriven>>

export default function composeUsecases(driven: Driven): {
	listProjects: ListProjectsUseCasePort
	sendProjectMessage: SendProjectMessageUseCasePort
	getConfig: GetConfigUseCasePort
	updateConfig: UpdateConfigUseCasePort
	approveToolCall: ApproveToolCallUseCasePort
	denyToolCall: DenyToolCallUseCasePort
} {
	return {
		listProjects: new ListProjectsUsecase(driven.projectRepository),
		sendProjectMessage: new SendProjectMessageUsecase(
			driven.projectRepository,
			driven.sessionRepository,
			driven.eventLog,
			driven.agentRuntime,
		),
		getConfig: new GetConfigUsecase(driven.configRepository),
		updateConfig: new UpdateConfigUsecase(driven.configRepository),
		approveToolCall: new ApproveToolCallUsecase(driven.approval),
		denyToolCall: new DenyToolCallUsecase(driven.approval),
	}
}
