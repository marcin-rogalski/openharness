import type { ApiSchema } from '@openharness/fetch'
import {
	createAgentEndpoint,
	listAgentsEndpoint,
	updateAgentEndpoint,
} from './agents'
import {
	createBudgetEndpoint,
	listBudgetsEndpoint,
	updateBudgetEndpoint,
} from './budgets'
import { getConfigEndpoint, updateConfigEndpoint } from './config'
import { healthEndpoint } from './health'
import { sendMessageEndpoint } from './messages'
import {
	createPermissionEndpoint,
	listPermissionsEndpoint,
	updatePermissionEndpoint,
} from './permissions'
import { listProjectsEndpoint } from './projects'
import {
	createRuleEndpoint,
	listRulesEndpoint,
	updateRuleEndpoint,
} from './rules'
import { listSessionsEndpoint } from './sessions'
import { approveToolCallEndpoint, denyToolCallEndpoint } from './toolCalls'

export * from './agents'
export * from './budgets'
export * from './config'
export * from './events'
export * from './health'
export * from './messages'
export * from './permissions'
export * from './projects'
export * from './rules'
export * from './sessions'
export * from './toolCalls'
export * from './tools'

export const harnessApiSchema = {
	health: healthEndpoint,
	listProjects: listProjectsEndpoint,
	listSessions: listSessionsEndpoint,
	sendMessage: sendMessageEndpoint,
	getConfig: getConfigEndpoint,
	updateConfig: updateConfigEndpoint,
	approveToolCall: approveToolCallEndpoint,
	denyToolCall: denyToolCallEndpoint,
	listAgents: listAgentsEndpoint,
	createAgent: createAgentEndpoint,
	updateAgent: updateAgentEndpoint,
	listRules: listRulesEndpoint,
	createRule: createRuleEndpoint,
	updateRule: updateRuleEndpoint,
	listBudgets: listBudgetsEndpoint,
	createBudget: createBudgetEndpoint,
	updateBudget: updateBudgetEndpoint,
	listPermissions: listPermissionsEndpoint,
	createPermission: createPermissionEndpoint,
	updatePermission: updatePermissionEndpoint,
} satisfies ApiSchema
