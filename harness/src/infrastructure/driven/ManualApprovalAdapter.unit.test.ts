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
	it('blocks until decide() resolves with approved', async () => {
		const adapter = new ManualApprovalAdapter()
		const promise = adapter.requestApproval(call)
		adapter.decide('call-1', 'approved')
		const decision = await promise

		expect(decision).toBe('approved')
	})

	it('blocks until decide() resolves with denied', async () => {
		const adapter = new ManualApprovalAdapter()
		const promise = adapter.requestApproval(call)
		adapter.decide('call-1', 'denied')
		const decision = await promise

		expect(decision).toBe('denied')
	})

	it('resolves multiple pending requests independently', async () => {
		const adapter = new ManualApprovalAdapter()
		const call2: ToolCall = { ...call, id: 'call-2' }
		const p1 = adapter.requestApproval(call)
		const p2 = adapter.requestApproval(call2)
		adapter.decide('call-2', 'approved')
		adapter.decide('call-1', 'denied')

		expect(await p1).toBe('denied')
		expect(await p2).toBe('approved')
	})

	it('ignores decide() for unknown toolCallId', () => {
		const adapter = new ManualApprovalAdapter()
		expect(() => adapter.decide('unknown', 'approved')).not.toThrow()
	})
})
