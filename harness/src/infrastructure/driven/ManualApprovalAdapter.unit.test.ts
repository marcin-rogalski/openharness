import { describe, expect, it } from 'vitest'
import type { ToolCall } from '@/domain/ToolCall'
import ManualApprovalAdapter from './ManualApprovalAdapter'

const call: ToolCall = {
	id: 'call-1',
	sessionId: 'session-1',
	toolId: 'mock_tool',
	input: {},
	status: 'pending',
	createdAt: '2026-01-01T00:00:00Z',
}

describe('ManualApprovalAdapter', () => {
	it('denies by default when no decision has been made', async () => {
		const adapter = new ManualApprovalAdapter()
		const decision = await adapter.requestApproval(call)

		expect(decision).toBe('denied')
	})

	it('returns the recorded decision', async () => {
		const adapter = new ManualApprovalAdapter()
		adapter.decide('call-1', 'approved')
		const decision = await adapter.requestApproval(call)

		expect(decision).toBe('approved')
	})

	it('records denial decisions', async () => {
		const adapter = new ManualApprovalAdapter()
		adapter.decide('call-1', 'denied')
		const decision = await adapter.requestApproval(call)

		expect(decision).toBe('denied')
	})
})
