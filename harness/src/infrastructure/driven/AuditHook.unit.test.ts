import { describe, expect, it } from 'vitest'
import type { HookContext } from '@/domain/Hook'
import AuditHook, { type AuditSink } from './AuditHook'

function createContext(): HookContext {
	return {
		sessionId: 'session-1',
		projectId: 'project-1',
		turnId: null,
		stepId: null,
		timestamp: '2026-01-01T00:00:00Z',
	}
}

function createSink() {
	const entries: Array<{
		hookId: string
		sessionId: string
		decision: string
		reason: string | null
		timestamp: string
	}> = []
	return {
		entries,
		record: (entry: (typeof entries)[0]) => {
			entries.push(entry)
		},
	} as AuditSink & { entries: typeof entries }
}

describe('AuditHook', () => {
	it('always allows', async () => {
		const hook = new AuditHook(createSink())
		const result = await hook.invoke(createContext(), {})
		expect(result.decision).toBe('allow')
	})

	it('records an audit entry', async () => {
		const sink = createSink()
		const hook = new AuditHook(sink)
		await hook.invoke(createContext(), {})

		expect(sink.entries).toHaveLength(1)
		expect(sink.entries[0].hookId).toBe('audit')
		expect(sink.entries[0].sessionId).toBe('session-1')
		expect(sink.entries[0].decision).toBe('observe')
	})

	it('has the lowest priority (runs last)', () => {
		const hook = new AuditHook(createSink())
		expect(hook.priority).toBe(999)
	})
})
