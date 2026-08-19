// Usecases — one business operation each
// Takes driven adapters, returns usecase ports.

import type { AgentUsecasePort } from '@/application/ports/usecases/AgentUsecasePort'
import type { ApproveToolCallUseCasePort } from '@/application/ports/usecases/ApproveToolCallUseCasePort'
import type { BudgetUsecasePort } from '@/application/ports/usecases/BudgetUsecasePort'
import type { DenyToolCallUseCasePort } from '@/application/ports/usecases/DenyToolCallUseCasePort'
import type { GetConfigUseCasePort } from '@/application/ports/usecases/GetConfigUseCasePort'
import type { ListProjectsUseCasePort } from '@/application/ports/usecases/ListProjectsUseCasePort'
import type { ListSessionsUseCasePort } from '@/application/ports/usecases/ListSessionsUseCasePort'
import type { PermissionUsecasePort } from '@/application/ports/usecases/PermissionUsecasePort'
import type { RuleUsecasePort } from '@/application/ports/usecases/RuleUsecasePort'
import type { SendProjectMessageUseCasePort } from '@/application/ports/usecases/SendProjectMessageUseCasePort'
import type { UpdateConfigUseCasePort } from '@/application/ports/usecases/UpdateConfigUseCasePort'
import AgentLoopService from '@/application/services/AgentLoopService'
import HookRegistryService from '@/application/services/HookRegistryService'
import ToolExecutionService from '@/application/services/ToolExecutionService'
import AgentUsecase from '@/application/usecases/AgentUsecase'
import ApproveToolCallUsecase from '@/application/usecases/ApproveToolCallUsecase'
import BudgetUsecase from '@/application/usecases/BudgetUsecase'
import DenyToolCallUsecase from '@/application/usecases/DenyToolCallUsecase'
import GetConfigUsecase from '@/application/usecases/GetConfigUsecase'
import ListProjectsUsecase from '@/application/usecases/ListProjectsUsecase'
import ListSessionsUsecase from '@/application/usecases/ListSessionsUsecase'
import PermissionUsecase from '@/application/usecases/PermissionUsecase'
import RuleUsecase from '@/application/usecases/RuleUsecase'
import SendProjectMessageUsecase from '@/application/usecases/SendProjectMessageUsecase'
import UpdateConfigUsecase from '@/application/usecases/UpdateConfigUsecase'
import type composeDriven from './composedDriven'

type Driven = Awaited<ReturnType<typeof composeDriven>>

export default function composeUsecases(driven: Driven): {
	listProjects: ListProjectsUseCasePort
	listSessions: ListSessionsUseCasePort
	sendProjectMessage: SendProjectMessageUseCasePort
	getConfig: GetConfigUseCasePort
	updateConfig: UpdateConfigUseCasePort
	approveToolCall: ApproveToolCallUseCasePort
	denyToolCall: DenyToolCallUseCasePort
	agents: AgentUsecasePort
	rules: RuleUsecasePort
	budgets: BudgetUsecasePort
	permissions: PermissionUsecasePort
} {
	const toolExecution = new ToolExecutionService(
		driven.toolRegistry,
		driven.toolExecutor,
		driven.policy,
		driven.approval,
		driven.sandbox,
		driven.eventLog,
	)

	const hooks = new HookRegistryService()

	const agentLoop = new AgentLoopService(
		driven.agentRuntime,
		toolExecution,
		driven.toolRegistry,
		driven.eventLog,
		hooks,
	)

	return {
		listProjects: new ListProjectsUsecase(driven.projectRepository),
		listSessions: new ListSessionsUsecase(
			driven.sessionRepository,
			driven.eventLog,
		),
		sendProjectMessage: new SendProjectMessageUsecase(
			driven.projectRepository,
			driven.sessionRepository,
			driven.eventLog,
			agentLoop,
		),
		getConfig: new GetConfigUsecase(driven.configRepository),
		updateConfig: new UpdateConfigUsecase(driven.configRepository),
		approveToolCall: new ApproveToolCallUsecase(driven.approval),
		denyToolCall: new DenyToolCallUsecase(driven.approval),
		agents: new AgentUsecase(driven.agentRepository),
		rules: new RuleUsecase(driven.ruleRepository),
		budgets: new BudgetUsecase(driven.budgetRepository),
		permissions: new PermissionUsecase(driven.permissionRepository),
	}
}
