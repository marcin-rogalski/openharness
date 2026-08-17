import type { SandboxDecision } from '@/domain/Sandbox'
import type { SandboxLevel } from '@/domain/ToolDefinition'

export interface SandboxPort {
	checkAccess(
		requiredLevel: SandboxLevel,
		path?: string,
	): Promise<SandboxDecision>
}
