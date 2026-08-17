export type ToolResultStatus = 'success' | 'error'

export interface ToolResult {
	toolCallId: string
	status: ToolResultStatus
	output: unknown
	error: string | null
	frozen: boolean
}
