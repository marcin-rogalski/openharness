import type { Project, TimelineEntry } from '../schema'

export interface HarnessApi {
	listProjects(): Promise<Project[]>
	sendMessage(projectId: string, content: string): Promise<TimelineEntry[]>
}
