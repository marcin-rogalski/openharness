import { z } from 'zod'

export const ProjectSchema = z.object({
	id: z.string(),
	name: z.string(),
	status: z.enum(['idle', 'running', 'failed']),
})

export const TimelineEntrySchema = z.discriminatedUnion('type', [
	z.object({
		type: z.literal('user_message'),
		id: z.string(),
		projectId: z.string(),
		content: z.string(),
	}),
	z.object({
		type: z.literal('agent_thinking'),
		id: z.string(),
		projectId: z.string(),
		text: z.string(),
	}),
	z.object({
		type: z.literal('agent_tool_call'),
		id: z.string(),
		projectId: z.string(),
		tool: z.string(),
		status: z.enum(['started', 'completed']),
		input: z.string().optional(),
		output: z.string().optional(),
	}),
	z.object({
		type: z.literal('agent_response'),
		id: z.string(),
		projectId: z.string(),
		text: z.string(),
	}),
])

export const GlobalStateSchema = z
	.object({
		projects: z.array(ProjectSchema),
		selectedProjectId: z.string().nullable(),
		timeline: z.array(TimelineEntrySchema),
	})
	.refine(
		(state) =>
			state.selectedProjectId === null ||
			state.projects.some((project) => project.id === state.selectedProjectId),
		{
			message: 'selectedProjectId must reference an existing project',
		},
	)

export const GlobalActionSchema = z.discriminatedUnion('type', [
	z.object({
		type: z.literal('projects/set'),
		projects: z.array(ProjectSchema),
	}),
	z.object({
		type: z.literal('project/select'),
		projectId: z.string().nullable(),
	}),
	z.object({
		type: z.literal('timeline/append'),
		entry: TimelineEntrySchema,
	}),
])

export type Project = z.infer<typeof ProjectSchema>
export type TimelineEntry = z.infer<typeof TimelineEntrySchema>
export type GlobalState = z.infer<typeof GlobalStateSchema>
export type GlobalAction = z.infer<typeof GlobalActionSchema>
