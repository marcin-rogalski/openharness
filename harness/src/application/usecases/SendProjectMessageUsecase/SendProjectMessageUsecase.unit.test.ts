import { describe, expect, it } from 'vitest'
import type { AgentRuntimePort } from '@/application/ports/adapters/AgentRuntimePort'
import type { EventLogPort } from '@/application/ports/adapters/EventLogPort'
import type { ProjectRepositoryPort } from '@/application/ports/adapters/ProjectRepositoryPort'
import type { SessionRepositoryPort } from '@/application/ports/adapters/SessionRepositoryPort'
import { ProjectNotFoundError } from '@/domain/ProjectNotFoundError'
import type { Session } from '@/domain/Session'
import type { SessionEvent } from '@/domain/SessionEvent'
import SendProjectMessageUsecase from './SendProjectMessageUsecase'

function createProjectRepository(project: { id: string } | null) {
	return {
		findById: async (id: string) =>
			project && project.id === id
				? { id: project.id, name: 'Test', status: 'idle' as const }
				: null,
		list: async () => [],
	} as ProjectRepositoryPort
}

function createSessionRepository(existing: Session | null = null) {
	const saved: Session[] = existing ? [existing] : []
	return {
		findById: async (id: string) => saved.find((s) => s.id === id) ?? null,
		findActiveByProjectId: async (projectId: string) =>
			saved.find((s) => s.projectId === projectId && s.status === 'active') ??
			null,
		save: async (session: Session) => {
			saved.push(session)
		},
	} as SessionRepositoryPort
}

function createEventLog() {
	const events: SessionEvent[] = []
	return {
		append: async (event: SessionEvent) => {
			events.push(event)
		},
		listBySession: async () => events,
		_getEvents: () => events,
	} as EventLogPort & { _getEvents: () => SessionEvent[] }
}

function createAgentRuntime() {
	return {
		handle: async ({
			context,
		}: {
			sessionId: string
			projectId: string
			context: { role: string; content: string }[]
		}) => {
			const lastUser = [...context].reverse().find((m) => m.role === 'user')
			return {
				thinking: `Thinking about: ${lastUser?.content ?? ''}`,
				toolCalls: [
					{ tool: 'mock_tool', input: lastUser?.content ?? '', output: 'ok' },
				],
				response: `Mock response to: ${lastUser?.content ?? ''}`,
			}
		},
	} as AgentRuntimePort
}

describe('SendProjectMessageUsecase', () => {
	it('creates a session and returns user and model events', async () => {
		const eventLog = createEventLog()
		const usecase = new SendProjectMessageUsecase(
			createProjectRepository({ id: 'project-1' }),
			createSessionRepository(),
			eventLog,
			createAgentRuntime(),
		)

		const result = await usecase.handle({
			projectId: 'project-1',
			content: 'Hello',
		})

		expect(result.sessionId).toBeTypeOf('string')
		expect(result.events.map((e) => e.type)).toEqual([
			'session_created',
			'user_message',
			'model_output_received',
		])
		expect(result.events[1]).toMatchObject({
			projectId: 'project-1',
			actor: 'user',
			payload: { content: 'Hello' },
		})
		expect(result.events[2]).toMatchObject({
			projectId: 'project-1',
			actor: 'agent',
			payload: {
				response: 'Mock response to: Hello',
			},
		})
	})

	it('reuses an existing active session', async () => {
		const existingSession: Session = {
			id: 'session-1',
			projectId: 'project-1',
			status: 'active',
			createdAt: '2026-01-01T00:00:00Z',
			endedAt: null,
		}
		const usecase = new SendProjectMessageUsecase(
			createProjectRepository({ id: 'project-1' }),
			createSessionRepository(existingSession),
			createEventLog(),
			createAgentRuntime(),
		)

		const result = await usecase.handle({
			projectId: 'project-1',
			content: 'Hello again',
		})

		expect(result.sessionId).toBe('session-1')
		expect(result.events.map((e) => e.type)).toEqual([
			'user_message',
			'model_output_received',
		])
	})

	it('trims message content before handling', async () => {
		const usecase = new SendProjectMessageUsecase(
			createProjectRepository({ id: 'project-1' }),
			createSessionRepository(),
			createEventLog(),
			createAgentRuntime(),
		)

		const result = await usecase.handle({
			projectId: 'project-1',
			content: '  Hello  ',
		})

		const userEvent = result.events.find((e) => e.type === 'user_message')
		expect(userEvent?.payload.content).toBe('Hello')
	})

	it('rejects empty content', async () => {
		const usecase = new SendProjectMessageUsecase(
			createProjectRepository({ id: 'project-1' }),
			createSessionRepository(),
			createEventLog(),
			createAgentRuntime(),
		)

		await expect(
			usecase.handle({ projectId: 'project-1', content: '   ' }),
		).rejects.toThrow()
	})

	it('throws when the project does not exist', async () => {
		const usecase = new SendProjectMessageUsecase(
			createProjectRepository(null),
			createSessionRepository(),
			createEventLog(),
			createAgentRuntime(),
		)

		await expect(
			usecase.handle({ projectId: 'missing', content: 'Hello' }),
		).rejects.toThrow(ProjectNotFoundError)
	})

	it('derives context from prior events for the agent runtime', async () => {
		const existingSession: Session = {
			id: 'session-1',
			projectId: 'project-1',
			status: 'active',
			createdAt: '2026-01-01T00:00:00Z',
			endedAt: null,
		}
		const priorEvents: SessionEvent[] = [
			{
				id: 'e1',
				sessionId: 'session-1',
				projectId: 'project-1',
				turnId: null,
				stepId: null,
				timestamp: '2026-01-01T00:00:01Z',
				actor: 'user',
				type: 'user_message',
				payload: { content: 'Previous message' },
				visibility: 'both',
			},
		]
		const eventLog = {
			append: async (event: SessionEvent) => {
				priorEvents.push(event)
			},
			listBySession: async () => priorEvents,
		} as EventLogPort

		let receivedContext: { role: string; content: string }[] = []
		const agentRuntime = {
			handle: async ({
				context,
			}: {
				sessionId: string
				projectId: string
				context: { role: string; content: string }[]
			}) => {
				receivedContext = context
				return {
					thinking: null,
					toolCalls: [],
					response: 'ok',
				}
			},
		} as AgentRuntimePort

		const usecase = new SendProjectMessageUsecase(
			createProjectRepository({ id: 'project-1' }),
			createSessionRepository(existingSession),
			eventLog,
			agentRuntime,
		)

		await usecase.handle({
			projectId: 'project-1',
			content: 'New message',
		})

		expect(receivedContext).toEqual([
			{ role: 'user', content: 'Previous message' },
			{ role: 'user', content: 'New message' },
		])
	})
})
