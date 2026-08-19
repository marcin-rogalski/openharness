import type { ReactNode } from 'react'
import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useReducer,
} from 'react'
import type { HarnessApi } from './api/HarnessApi'
import { projectEventsToTimeline, stringifyEventValue } from './projectEvents'
import { globalReducer } from './reducer'
import { type GlobalState, GlobalStateSchema, type Project } from './schema'

interface GlobalContextValue {
	state: GlobalState
	actions: {
		setProjects: (projects: Project[]) => void
		selectProject: (projectId: string | null) => void
		selectSession: (sessionId: string) => void
		createProject: (name: string) => Promise<void>
		sendMessage: (content: string) => Promise<void>
		approveToolCall: (toolCallId: string) => Promise<void>
		denyToolCall: (toolCallId: string) => Promise<void>
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

	useEffect(() => {
		if (!state.selectedProjectId) {
			return
		}

		let active = true

		api
			.listSessions(state.selectedProjectId)
			.then((sessions) => {
				if (active) {
					dispatch({ type: 'sessions/set', sessions })
				}
			})
			.catch(() => {})

		return () => {
			active = false
		}
	}, [api, state.selectedProjectId])

	useEffect(() => {
		if (!state.sessionId) {
			return
		}

		const unsubscribe = api.subscribeToEvents(state.sessionId, (event) => {
			const entries = projectEventsToTimeline([event])
			for (const entry of entries) {
				dispatch({ type: 'timeline/append', entry })
			}

			if (event.type === 'approval_requested') {
				const toolCallId = event.payload.toolCallId
				if (typeof toolCallId !== 'string') {
					return
				}
				const toolId = event.payload.toolId
				const legacyTool = event.payload.tool
				const tool =
					typeof toolId === 'string'
						? toolId
						: typeof legacyTool === 'string'
							? legacyTool
							: 'unknown'
				dispatch({
					type: 'approval/set',
					approval: {
						toolCallId,
						tool,
						input: stringifyEventValue(event.payload.input) ?? '',
					},
				})
			} else if (event.type === 'approval_decided') {
				dispatch({ type: 'approval/clear' })
			}
		})

		return unsubscribe
	}, [api, state.sessionId])

	const value = useMemo<GlobalContextValue>(
		() => ({
			state,
			actions: {
				setProjects: (projects) => dispatch({ type: 'projects/set', projects }),
				selectProject: (projectId) =>
					dispatch({ type: 'project/select', projectId }),
				selectSession: (sessionId) =>
					dispatch({ type: 'session/set', sessionId }),
				createProject: async (name) => {
					try {
						const project = await api.createProject(name)
						const projects = [...state.projects, project]
						dispatch({ type: 'projects/set', projects })
						dispatch({ type: 'project/select', projectId: project.id })
						dispatch({ type: 'error/set', error: null })
					} catch (error: unknown) {
						dispatch({
							type: 'error/set',
							error: getErrorMessage(error, 'Failed to create project'),
						})
					}
				},
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
				approveToolCall: async (toolCallId) => {
					try {
						await api.approveToolCall(toolCallId)
						dispatch({ type: 'approval/clear' })
					} catch (error: unknown) {
						dispatch({
							type: 'error/set',
							error: getErrorMessage(error, 'Failed to approve tool call'),
						})
					}
				},
				denyToolCall: async (toolCallId) => {
					try {
						await api.denyToolCall(toolCallId)
						dispatch({ type: 'approval/clear' })
					} catch (error: unknown) {
						dispatch({
							type: 'error/set',
							error: getErrorMessage(error, 'Failed to deny tool call'),
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
