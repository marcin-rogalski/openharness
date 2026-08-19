import type { GlobalState } from './schema'

export const emptyState: GlobalState = {
	projects: [],
	selectedProjectId: null,
	sessions: [],
	sessionId: null,
	timeline: [],
	error: null,
	pendingApproval: null,
}
