import type { ApiSchema } from '@openharness/fetch'
import { getConfigEndpoint, updateConfigEndpoint } from './config'
import { healthEndpoint } from './health'
import { sendMessageEndpoint } from './messages'
import { listProjectsEndpoint } from './projects'

export * from './config'
export * from './health'
export * from './messages'
export * from './projects'

export const harnessApiSchema = {
	health: healthEndpoint,
	listProjects: listProjectsEndpoint,
	sendMessage: sendMessageEndpoint,
	getConfig: getConfigEndpoint,
	updateConfig: updateConfigEndpoint,
} satisfies ApiSchema
