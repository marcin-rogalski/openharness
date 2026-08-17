import { describe, expect, it } from 'vitest'
import type { HookPort } from '@/application/ports/adapters/HookPort'
import type { HookContext, HookResult } from '@/domain/Hook'
import HookRegistryService from './HookRegistryService'

function createContext(overrides: Partial<HookContext> = {}): HookContext {
	return {
		sessionId: 'session-1',
		projectId: 'project-1',
		turnId: null,
		stepId: null,
		timestamp: '2026-01-01T00:00:00Z',
		...overrides,
	}
}

function createHook(
	id: string,
	priority: number,
	result: HookResult,
): HookPort {
	return {
		id,
		priority,
		invoke: async () => result,
	}
}

describe('HookRegistryService', () => {
	it('allows when no hooks are registered', async () => {
		const registry = new HookRegistryService()
		const result = await registry.invoke(createContext(), {})

		expect(result.allowed).toBe(true)
		expect(result.annotations).toEqual([])
		expect(result.deniedBy).toBeNull()
	})

	it('allows when all hooks allow', async () => {
		const registry = new HookRegistryService()
		registry.register(
			createHook('hook-1', 1, {
				decision: 'allow',
				annotations: [],
				reason: null,
			}),
		)
		registry.register(
			createHook('hook-2', 2, {
				decision: 'allow',
				annotations: [],
				reason: null,
			}),
		)

		const result = await registry.invoke(createContext(), {})

		expect(result.allowed).toBe(true)
		expect(result.deniedBy).toBeNull()
	})

	it('denies when any hook denies', async () => {
		const registry = new HookRegistryService()
		registry.register(
			createHook('hook-1', 1, {
				decision: 'allow',
				annotations: [],
				reason: null,
			}),
		)
		registry.register(
			createHook('hook-2', 2, {
				decision: 'deny',
				annotations: [],
				reason: 'budget exceeded',
			}),
		)

		const result = await registry.invoke(createContext(), {})

		expect(result.allowed).toBe(false)
		expect(result.deniedBy).toBe('hook-2')
		expect(result.reason).toBe('budget exceeded')
	})

	it('collects annotations from all hooks before a denial', async () => {
		const registry = new HookRegistryService()
		registry.register(
			createHook('hook-1', 1, {
				decision: 'annotate',
				annotations: [{ hookId: 'hook-1', key: 'trace', value: 'start' }],
				reason: null,
			}),
		)
		registry.register(
			createHook('hook-2', 2, {
				decision: 'deny',
				annotations: [],
				reason: 'denied',
			}),
		)

		const result = await registry.invoke(createContext(), {})

		expect(result.allowed).toBe(false)
		expect(result.annotations).toHaveLength(1)
		expect(result.annotations[0].key).toBe('trace')
	})

	it('invokes hooks in priority order', async () => {
		const callOrder: string[] = []

		const hookA = {
			id: 'hook-a',
			priority: 10,
			invoke: async () => {
				callOrder.push('hook-a')
				return { decision: 'allow' as const, annotations: [], reason: null }
			},
		}
		const hookB = {
			id: 'hook-b',
			priority: 1,
			invoke: async () => {
				callOrder.push('hook-b')
				return { decision: 'allow' as const, annotations: [], reason: null }
			},
		}

		const registry = new HookRegistryService()
		registry.register(hookA)
		registry.register(hookB)

		await registry.invoke(createContext(), {})

		expect(callOrder).toEqual(['hook-b', 'hook-a'])
	})

	it('stops invoking hooks after a denial', async () => {
		const callOrder: string[] = []

		const hookA = {
			id: 'hook-a',
			priority: 1,
			invoke: async () => {
				callOrder.push('hook-a')
				return { decision: 'deny' as const, annotations: [], reason: 'no' }
			},
		}
		const hookB = {
			id: 'hook-b',
			priority: 2,
			invoke: async () => {
				callOrder.push('hook-b')
				return { decision: 'allow' as const, annotations: [], reason: null }
			},
		}

		const registry = new HookRegistryService()
		registry.register(hookA)
		registry.register(hookB)

		await registry.invoke(createContext(), {})

		expect(callOrder).toEqual(['hook-a'])
	})

	it('tracks registered hook count', () => {
		const registry = new HookRegistryService()
		expect(registry.size).toBe(0)

		registry.register(
			createHook('hook-1', 1, {
				decision: 'allow',
				annotations: [],
				reason: null,
			}),
		)
		expect(registry.size).toBe(1)
	})

	it('passes context and payload to hooks', async () => {
		let receivedContext: HookContext | null = null
		let receivedPayload: unknown = null

		const hook: HookPort = {
			id: 'observer',
			priority: 1,
			invoke: async (ctx, payload) => {
				receivedContext = ctx
				receivedPayload = payload
				return { decision: 'allow', annotations: [], reason: null }
			},
		}

		const registry = new HookRegistryService()
		registry.register(hook)

		const context = createContext({ sessionId: 'custom-session' })
		const payload = { toolId: 'test_tool' }
		await registry.invoke(context, payload)

		expect(receivedContext?.sessionId).toBe('custom-session')
		expect(receivedPayload).toEqual(payload)
	})
})
