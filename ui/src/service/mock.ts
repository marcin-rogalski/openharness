import type { GlobalState } from './schema'

export const mockState: GlobalState = {
	projects: [
		{ id: 'project-1', name: 'OpenHarness', status: 'running' },
		{ id: 'project-2', name: 'Tempo', status: 'idle' },
	],
	selectedProjectId: null,
	sessions: [],
	sessionId: null,
	timeline: [],
	error: null,
	pendingApproval: null,
}
