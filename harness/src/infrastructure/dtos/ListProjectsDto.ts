import { z } from 'zod'

export const ProjectDto = z.object({
	id: z.string(),
	name: z.string(),
	status: z.enum(['idle', 'running', 'failed']),
})

export const ListProjectsResponseDto = z.object({
	projects: z.array(ProjectDto),
})
