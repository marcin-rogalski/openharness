import type { ReactNode } from 'react'
import { createContext, useContext, useMemo, useReducer } from 'react'
import { createMockTimelineEntries } from './mockTimeline'
import { globalReducer } from './reducer'
import { type GlobalState, GlobalStateSchema, type Project } from './schema'

interface GlobalContextValue {
	state: GlobalState
	actions: {
		setProjects: (projects: Project[]) => void
		selectProject: (projectId: string | null) => void
		sendMessage: (content: string) => void
	}
}

const GlobalContext = createContext<GlobalContextValue | null>(null)

interface GlobalProviderProps {
	children: ReactNode
	initialState: GlobalState
}

export function GlobalProvider({
	children,
	initialState,
}: GlobalProviderProps) {
	const [state, dispatch] = useReducer(
		globalReducer,
		initialState,
		GlobalStateSchema.parse,
	)

	const value = useMemo<GlobalContextValue>(
		() => ({
			state,
			actions: {
				setProjects: (projects) => dispatch({ type: 'projects/set', projects }),
				selectProject: (projectId) =>
					dispatch({ type: 'project/select', projectId }),
				sendMessage: (content) => {
					const trimmed = content.trim()
					const projectId = state.selectedProjectId
					if (!trimmed || !projectId) {
						return
					}

					dispatch({
						type: 'timeline/append',
						entry: {
							type: 'user_message',
							id: crypto.randomUUID(),
							projectId,
							content: trimmed,
						},
					})

					for (const entry of createMockTimelineEntries(projectId, trimmed)) {
						dispatch({ type: 'timeline/append', entry })
					}
				},
			},
		}),
		[state],
	)

	return (
		<GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
	)
}

export function useGlobal() {
	const context = useContext(GlobalContext)
	if (!context) {
		throw new Error('useGlobal must be used within a GlobalProvider')
	}
	return context
}
