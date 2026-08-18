// Driving adapters — call INTO the app
// Takes usecase ports, returns driving adapters.

import ApproveToolCallEndpoint from '@/infrastructure/driving/ApproveToolCallEndpoint'
import CreateAgentEndpoint from '@/infrastructure/driving/CreateAgentEndpoint'
import CreateBudgetEndpoint from '@/infrastructure/driving/CreateBudgetEndpoint'
import CreatePermissionEndpoint from '@/infrastructure/driving/CreatePermissionEndpoint'
import CreateRuleEndpoint from '@/infrastructure/driving/CreateRuleEndpoint'
import DenyToolCallEndpoint from '@/infrastructure/driving/DenyToolCallEndpoint'
import GetConfigEndpoint from '@/infrastructure/driving/GetConfigEndpoint'
import HealthEndpoint from '@/infrastructure/driving/HealthEndpoint'
import ListAgentsEndpoint from '@/infrastructure/driving/ListAgentsEndpoint'
import ListBudgetsEndpoint from '@/infrastructure/driving/ListBudgetsEndpoint'
import ListPermissionsEndpoint from '@/infrastructure/driving/ListPermissionsEndpoint'
import ListProjectsEndpoint from '@/infrastructure/driving/ListProjectsEndpoint'
import ListRulesEndpoint from '@/infrastructure/driving/ListRulesEndpoint'
import SendProjectMessageEndpoint from '@/infrastructure/driving/SendProjectMessageEndpoint'
import UpdateAgentEndpoint from '@/infrastructure/driving/UpdateAgentEndpoint'
import UpdateBudgetEndpoint from '@/infrastructure/driving/UpdateBudgetEndpoint'
import UpdateConfigEndpoint from '@/infrastructure/driving/UpdateConfigEndpoint'
import UpdatePermissionEndpoint from '@/infrastructure/driving/UpdatePermissionEndpoint'
import UpdateRuleEndpoint from '@/infrastructure/driving/UpdateRuleEndpoint'
import type composeUsecases from './composedUsecases'

type Usecases = ReturnType<typeof composeUsecases>

export default function composeDriving(usecases: Usecases) {
	return [
		new HealthEndpoint(),
		new ListProjectsEndpoint(usecases.listProjects),
		new SendProjectMessageEndpoint(usecases.sendProjectMessage),
		new GetConfigEndpoint(usecases.getConfig),
		new UpdateConfigEndpoint(usecases.updateConfig),
		new ApproveToolCallEndpoint(usecases.approveToolCall),
		new DenyToolCallEndpoint(usecases.denyToolCall),
		new ListAgentsEndpoint(usecases.agents),
		new CreateAgentEndpoint(usecases.agents),
		new UpdateAgentEndpoint(usecases.agents),
		new ListRulesEndpoint(usecases.rules),
		new CreateRuleEndpoint(usecases.rules),
		new UpdateRuleEndpoint(usecases.rules),
		new ListBudgetsEndpoint(usecases.budgets),
		new CreateBudgetEndpoint(usecases.budgets),
		new UpdateBudgetEndpoint(usecases.budgets),
		new ListPermissionsEndpoint(usecases.permissions),
		new CreatePermissionEndpoint(usecases.permissions),
		new UpdatePermissionEndpoint(usecases.permissions),
	]
}
