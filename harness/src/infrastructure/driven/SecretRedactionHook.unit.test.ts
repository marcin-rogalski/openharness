import { describe, expect, it } from 'vitest'
import type { HookContext } from '@/domain/Hook'
import SecretRedactionHook from './SecretRedactionHook'

function createContext(): HookContext {
	return {
		sessionId: 'session-1',
		projectId: 'project-1',
		turnId: null,
		stepId: null,
		timestamp: '2026-01-01T00:00:00Z',
	}
}

describe('SecretRedactionHook', () => {
	it('allows when no secrets are present', async () => {
		const hook = new SecretRedactionHook()
		const result = await hook.invoke(createContext(), { message: 'hello' })

		expect(result.decision).toBe('allow')
		expect(result.annotations).toEqual([])
	})

	it('annotates when secrets are detected', async () => {
		const hook = new SecretRedactionHook()
		const result = await hook.invoke(createContext(), {
			config: 'api_key=abc123',
		})

		expect(result.decision).toBe('annotate')
		expect(result.annotations).toHaveLength(1)
		expect(result.annotations[0].key).toBe('redacted_secrets')
		expect(result.annotations[0].value).toBe(1)
	})

	it('counts multiple secrets', async () => {
		const hook = new SecretRedactionHook()
		const result = await hook.invoke(createContext(), {
			a: 'token=xyz',
			b: 'password=hunter2',
		})

		expect(result.decision).toBe('annotate')
		expect(result.annotations[0].value).toBe(2)
	})

	it('never denies', async () => {
		const hook = new SecretRedactionHook()
		const result = await hook.invoke(createContext(), {
			secret: 'topsecret',
		})

		expect(result.decision).not.toBe('deny')
	})

	it('has high priority (runs early)', () => {
		const hook = new SecretRedactionHook()
		expect(hook.priority).toBe(5)
	})
})
