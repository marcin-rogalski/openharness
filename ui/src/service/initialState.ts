import type { GlobalState } from './schema'

export const emptyState: GlobalState = {
	projects: [],
	selectedProjectId: null,
	sessionId: null,
	timeline: [],
	error: null,
	pendingApproval: null,
}
