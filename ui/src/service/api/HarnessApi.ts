import type {
	ConfigSchema,
	UpdateConfigBodySchema,
	UpdateConfigResponseSchema,
} from '@openharness/contracts'
import type { z } from 'zod'
import type { Project, SessionEvent } from '../schema'

export type HarnessConfig = z.infer<typeof ConfigSchema>

export type UpdateConfigInput = z.input<typeof UpdateConfigBodySchema>

export type UpdateConfigResult = z.infer<typeof UpdateConfigResponseSchema>

export interface SendMessageResult {
	sessionId: string
	events: SessionEvent[]
}

export interface HarnessApi {
	health(): Promise<void>
	listProjects(): Promise<Project[]>
	sendMessage(projectId: string, content: string): Promise<SendMessageResult>
	getConfig(): Promise<HarnessConfig>
	updateConfig(input: UpdateConfigInput): Promise<UpdateConfigResult>
}
