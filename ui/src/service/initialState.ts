import type { GlobalState } from './schema'

export const emptyState: GlobalState = {
	projects: [],
	selectedProjectId: null,
	timeline: [],
	error: null,
}
