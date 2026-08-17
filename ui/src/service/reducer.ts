import {
	type GlobalAction,
	GlobalActionSchema,
	type GlobalState,
	GlobalStateSchema,
} from './schema'

export function globalReducer(
	state: GlobalState,
	action: GlobalAction,
): GlobalState {
	GlobalStateSchema.parse(state)
	GlobalActionSchema.parse(action)

	switch (action.type) {
		case 'projects/set':
			return {
				...state,
				projects: action.projects,
				selectedProjectId: action.projects.some(
					(project) => project.id === state.selectedProjectId,
				)
					? state.selectedProjectId
					: null,
			}
		case 'project/select':
			if (
				action.projectId !== null &&
				!state.projects.some((project) => project.id === action.projectId)
			) {
				return state
			}

			return {
				...state,
				selectedProjectId: action.projectId,
				sessionId: null,
			}
		case 'timeline/append':
			return {
				...state,
				timeline: [...state.timeline, action.entry],
			}
		case 'session/set':
			return {
				...state,
				sessionId: action.sessionId,
			}
		case 'error/set':
			return {
				...state,
				error: action.error,
			}
	}
}
