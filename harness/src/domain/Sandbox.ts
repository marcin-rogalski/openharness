import type { SandboxLevel } from './ToolDefinition'

export interface SandboxPolicy {
	level: SandboxLevel
	workspaceRoot: string
}

export interface SandboxDecision {
	allowed: boolean
	reason: string | null
}
