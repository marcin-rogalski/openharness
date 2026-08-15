import type { Project } from '@/domain/Project'

export interface ListProjectsOutput {
	projects: Project[]
}

export interface ListProjectsUseCasePort {
	handle(): Promise<ListProjectsOutput>
}
