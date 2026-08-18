import { describe, expect, it, vi } from 'vitest'
import type { EventLogPort } from '@/application/ports/adapters/EventLogPort'
import type { ProjectRepositoryPort } from '@/application/ports/adapters/ProjectRepositoryPort'
import type { SessionRepositoryPort } from '@/application/ports/adapters/SessionRepositoryPort'
import type { AgentLoopResult } from '@/application/services/AgentLoopService'
import { ProjectNotFoundError } from '@/domain/ProjectNotFoundError'
import type { Session } from '@/domain/Session'
import type { SessionEvent } from '@/domain/SessionEvent'
import SendProjectMessageUsecase from '.'

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

function createAgentLoopMock(result?: Partial<AgentLoopResult>) {
	return {
		run: vi.fn().mockResolvedValue({
			status: 'completed',
			steps: 1,
			reason: null,
			error: null,
			...result,
		}),
	}
}

describe('SendProjectMessageUsecase', () => {
	it('creates a session and returns initial events without waiting for the agent loop', async () => {
		const eventLog = createEventLog()
		const agentLoop = createAgentLoopMock()
		const usecase = new SendProjectMessageUsecase(
			createProjectRepository({ id: 'project-1' }),
			createSessionRepository(),
			eventLog,
			agentLoop as never,
		)

		const result = await usecase.handle({
			projectId: 'project-1',
			content: 'Hello',
		})

		expect(result.sessionId).toBeTypeOf('string')
		expect(agentLoop.run).toHaveBeenCalledOnce()
		const runCall = vi.mocked(agentLoop.run).mock.calls[0][0]
		expect(runCall.sessionId).toBe(result.sessionId)
		expect(runCall.projectId).toBe('project-1')
		expect(runCall.turnId).toBeTypeOf('string')
		const types = result.events.map((e) => e.type)
		expect(types).toContain('session_created')
		expect(types).toContain('user_message')
		expect(types).not.toContain('model_output_received')
	})

	it('reuses an existing active session', async () => {
		const existingSession: Session = {
			id: 'session-1',
			projectId: 'project-1',
			status: 'active',
			createdAt: '2026-01-01T00:00:00Z',
			endedAt: null,
		}
		const agentLoop = createAgentLoopMock()
		const usecase = new SendProjectMessageUsecase(
			createProjectRepository({ id: 'project-1' }),
			createSessionRepository(existingSession),
			createEventLog(),
			agentLoop as never,
		)

		const result = await usecase.handle({
			projectId: 'project-1',
			content: 'Hello again',
		})

		expect(result.sessionId).toBe('session-1')
		expect(agentLoop.run).toHaveBeenCalledOnce()
	})

	it('trims message content before handling', async () => {
		const agentLoop = createAgentLoopMock()
		const usecase = new SendProjectMessageUsecase(
			createProjectRepository({ id: 'project-1' }),
			createSessionRepository(),
			createEventLog(),
			agentLoop as never,
		)

		const result = await usecase.handle({
			projectId: 'project-1',
			content: '  Hello  ',
		})

		const userEvent = result.events.find((e) => e.type === 'user_message')
		expect(userEvent?.payload.content).toBe('Hello')
	})

	it('rejects empty content', async () => {
		const agentLoop = createAgentLoopMock()
		const usecase = new SendProjectMessageUsecase(
			createProjectRepository({ id: 'project-1' }),
			createSessionRepository(),
			createEventLog(),
			agentLoop as never,
		)

		await expect(
			usecase.handle({ projectId: 'project-1', content: '   ' }),
		).rejects.toThrow()
	})

	it('throws when the project does not exist', async () => {
		const agentLoop = createAgentLoopMock()
		const usecase = new SendProjectMessageUsecase(
			createProjectRepository(null),
			createSessionRepository(),
			createEventLog(),
			agentLoop as never,
		)

		await expect(
			usecase.handle({ projectId: 'missing', content: 'Hello' }),
		).rejects.toThrow(ProjectNotFoundError)
	})

	it('passes the turnId and config to the agent loop', async () => {
		const agentLoop = createAgentLoopMock()
		const usecase = new SendProjectMessageUsecase(
			createProjectRepository({ id: 'project-1' }),
			createSessionRepository(),
			createEventLog(),
			agentLoop as never,
		)

		await usecase.handle({
			projectId: 'project-1',
			content: 'Hello',
		})

		const runCall = vi.mocked(agentLoop.run).mock.calls[0][0]
		expect(runCall.config).toEqual({
			maxSteps: 20,
			maxParallelTools: 10,
		})
	})

	it('does not reject when the agent loop fails', async () => {
		const agentLoop = {
			run: vi.fn().mockRejectedValue(new Error('loop failed')),
		}
		const usecase = new SendProjectMessageUsecase(
			createProjectRepository({ id: 'project-1' }),
			createSessionRepository(),
			createEventLog(),
			agentLoop as never,
		)

		const result = await usecase.handle({
			projectId: 'project-1',
			content: 'Hello',
		})

		expect(result.sessionId).toBeTypeOf('string')
		expect(agentLoop.run).toHaveBeenCalledOnce()
	})
})
