import type { SandboxPolicy } from './Sandbox'
import type { Budget } from './Budget'

export interface AgentModelPreference {
	provider: string
	model: string
}

export interface Agent {
	id: string
	name: string
	role: string
	description: string
	tools: string[]
	mcpAccess: string[]
	memoryAccess: boolean
	sandboxPolicy: SandboxPolicy
	budget: Budget
	modelPreferences: AgentModelPreference
}
