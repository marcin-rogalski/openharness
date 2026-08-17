import type { ApiSchema } from '@openharness/fetch'
import { getConfigEndpoint, updateConfigEndpoint } from './config'
import { healthEndpoint } from './health'
import { sendMessageEndpoint } from './messages'
import { listProjectsEndpoint } from './projects'
import { approveToolCallEndpoint, denyToolCallEndpoint } from './toolCalls'

export * from './config'
export * from './events'
export * from './health'
export * from './messages'
export * from './projects'
export * from './sessions'
export * from './toolCalls'
export * from './tools'

export const harnessApiSchema = {
	health: healthEndpoint,
	listProjects: listProjectsEndpoint,
	sendMessage: sendMessageEndpoint,
	getConfig: getConfigEndpoint,
	updateConfig: updateConfigEndpoint,
	approveToolCall: approveToolCallEndpoint,
	denyToolCall: denyToolCallEndpoint,
} satisfies ApiSchema
