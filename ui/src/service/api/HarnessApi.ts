import type {
	AgentSchema,
	BudgetSchema,
	ConfigSchema,
	PermissionSchema,
	RuleSchema,
	UpdateConfigBodySchema,
	UpdateConfigResponseSchema,
} from '@openharness/contracts'
import type { z } from 'zod'
import type { Project, SessionEvent } from '../schema'

export type HarnessConfig = z.infer<typeof ConfigSchema>

export type UpdateConfigInput = z.input<typeof UpdateConfigBodySchema>

export type UpdateConfigResult = z.infer<typeof UpdateConfigResponseSchema>

export type Agent = z.infer<typeof AgentSchema>
export type Rule = z.infer<typeof RuleSchema>
export type Budget = z.infer<typeof BudgetSchema>
export type Permission = z.infer<typeof PermissionSchema>

export interface SendMessageResult {
	sessionId: string
	events: SessionEvent[]
}

export interface HarnessApi {
	health(): Promise<void>
	listProjects(): Promise<Project[]>
	sendMessage(projectId: string, content: string): Promise<SendMessageResult>
	getConfig(): Promise<HarnessConfig>
	updateConfig(input: UpdateConfigInput): Promise<UpdateConfigResult>
	listAgents(): Promise<Agent[]>
	createAgent(agent: Agent): Promise<Agent>
	updateAgent(id: string, agent: Agent): Promise<Agent>
	listRules(): Promise<Rule[]>
	createRule(rule: Rule): Promise<Rule>
	updateRule(id: string, rule: Rule): Promise<Rule>
	listBudgets(): Promise<Budget[]>
	createBudget(budget: Budget): Promise<Budget>
	updateBudget(id: string, budget: Budget): Promise<Budget>
	listPermissions(): Promise<Permission[]>
	createPermission(permission: Permission): Promise<Permission>
	updatePermission(id: string, permission: Permission): Promise<Permission>
}
