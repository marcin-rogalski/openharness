import type {
	ConfigSchema,
	UpdateConfigBodySchema,
	UpdateConfigResponseSchema,
} from '@openharness/contracts'
import type { z } from 'zod'
import type { Project, TimelineEntry } from '../schema'

export type HarnessConfig = z.infer<typeof ConfigSchema>

export type UpdateConfigInput = z.input<typeof UpdateConfigBodySchema>

export type UpdateConfigResult = z.infer<typeof UpdateConfigResponseSchema>

export interface HarnessApi {
	health(): Promise<void>
	listProjects(): Promise<Project[]>
	sendMessage(projectId: string, content: string): Promise<TimelineEntry[]>
	getConfig(): Promise<HarnessConfig>
	updateConfig(input: UpdateConfigInput): Promise<UpdateConfigResult>
}
