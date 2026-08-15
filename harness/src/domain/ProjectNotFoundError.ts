export class ProjectNotFoundError extends Error {
	constructor(projectId: string) {
		super(`Project not found: ${projectId}`)
		this.name = 'ProjectNotFoundError'
	}
}
