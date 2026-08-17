export type SandboxLevel = 'none' | 'read-only' | 'workspace-write' | 'full'

export interface ToolDefinition {
	id: string
	name: string
	description: string
	inputSchema: Record<string, unknown>
	sandboxLevel: SandboxLevel
}
