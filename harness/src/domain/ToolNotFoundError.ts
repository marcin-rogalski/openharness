export class ToolNotFoundError extends Error {
	constructor(toolId: string) {
		super(`Tool not found: ${toolId}`)
		this.name = 'ToolNotFoundError'
	}
}
