import type { ReactNode } from 'react'
import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useReducer,
} from 'react'
import type { HarnessApi } from './api/HarnessApi'
import { projectEventsToTimeline } from './projectEvents'
import { globalReducer } from './reducer'
import { type GlobalState, GlobalStateSchema, type Project } from './schema'

interface GlobalContextValue {
	state: GlobalState
	actions: {
		setProjects: (projects: Project[]) => void
		selectProject: (projectId: string | null) => void
		sendMessage: (content: string) => Promise<void>
	}
}

const GlobalContext = createContext<GlobalContextValue | null>(null)

interface GlobalProviderProps {
	children: ReactNode
	initialState: GlobalState
	api: HarnessApi
}

function getErrorMessage(error: unknown, fallback: string): string {
	return error instanceof Error ? error.message : fallback
}

export function GlobalProvider({
	children,
	initialState,
	api,
}: GlobalProviderProps) {
	const [state, dispatch] = useReducer(
		globalReducer,
		initialState,
		GlobalStateSchema.parse,
	)

	useEffect(() => {
		let active = true

		api
			.listProjects()
			.then((projects) => {
				if (active) {
					dispatch({ type: 'projects/set', projects })
				}
			})
			.catch((error: unknown) => {
				if (active) {
					dispatch({
						type: 'error/set',
						error: getErrorMessage(error, 'Failed to load projects'),
					})
				}
			})

		return () => {
			active = false
		}
	}, [api])

	const value = useMemo<GlobalContextValue>(
		() => ({
			state,
			actions: {
				setProjects: (projects) => dispatch({ type: 'projects/set', projects }),
				selectProject: (projectId) =>
					dispatch({ type: 'project/select', projectId }),
				sendMessage: async (content) => {
					const trimmed = content.trim()
					const projectId = state.selectedProjectId
					if (!trimmed || !projectId) {
						return
					}

					try {
						const { sessionId, events } = await api.sendMessage(
							projectId,
							trimmed,
						)
						dispatch({ type: 'session/set', sessionId })
						const entries = projectEventsToTimeline(events)
						for (const entry of entries) {
							dispatch({ type: 'timeline/append', entry })
						}
						dispatch({ type: 'error/set', error: null })
					} catch (error: unknown) {
						dispatch({
							type: 'error/set',
							error: getErrorMessage(error, 'Failed to send message'),
						})
					}
				},
			},
		}),
		[state, api],
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
