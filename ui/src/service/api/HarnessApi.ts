import type { Project, TimelineEntry } from '../schema'

export interface HarnessConfig {
	schemaVersion: 1
	port: number
	projectsDir: string
}

export interface UpdateConfigInput {
	port?: number
	projectsDir?: string
}

export interface UpdateConfigResult {
	config: HarnessConfig
	restartRequired: boolean
}

export interface HarnessApi {
	health(): Promise<void>
	listProjects(): Promise<Project[]>
	sendMessage(projectId: string, content: string): Promise<TimelineEntry[]>
	getConfig(): Promise<HarnessConfig>
	updateConfig(input: UpdateConfigInput): Promise<UpdateConfigResult>
}
