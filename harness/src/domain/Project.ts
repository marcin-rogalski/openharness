export type ProjectStatus = 'idle' | 'running' | 'failed'

export interface Project {
	id: string
	name: string
	status: ProjectStatus
}
