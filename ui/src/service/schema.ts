import {
	ProjectSchema,
	SessionEventSchema,
	TimelineEntrySchema,
} from '@openharness/contracts'
import { z } from 'zod'

export { ProjectSchema, SessionEventSchema, TimelineEntrySchema }

export const GlobalStateSchema = z
	.object({
		projects: z.array(ProjectSchema),
		selectedProjectId: z.string().nullable(),
		sessionId: z.string().nullable(),
		timeline: z.array(TimelineEntrySchema),
		error: z.string().nullable(),
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
	z.object({
		type: z.literal('session/set'),
		sessionId: z.string().nullable(),
	}),
	z.object({
		type: z.literal('error/set'),
		error: z.string().nullable(),
	}),
])

export type Project = z.infer<typeof ProjectSchema>
export type SessionEvent = z.infer<typeof SessionEventSchema>
export type TimelineEntry = z.infer<typeof TimelineEntrySchema>
export type GlobalState = z.infer<typeof GlobalStateSchema>
export type GlobalAction = z.infer<typeof GlobalActionSchema>
