import { describe, expect, it } from 'vitest'
import type { ToolCall } from '@/domain/ToolCall'
import AllowAllPolicyAdapter from './AllowAllPolicyAdapter'

const call: ToolCall = {
	id: 'call-1',
	sessionId: 'session-1',
	toolId: 'mock_tool',
	input: {},
	status: 'pending',
	createdAt: '2026-01-01T00:00:00Z',
}

describe('AllowAllPolicyAdapter', () => {
	it('always allows', async () => {
		const adapter = new AllowAllPolicyAdapter()
		const decision = await adapter.evaluate(call)

		expect(decision).toBe('allow')
	})
})
