import { describe, expect, it } from 'vitest'
import PermissionPolicyAdapter from '@/infrastructure/driven/PermissionPolicyAdapter'
import type { PermissionPort, PermissionCheckResult } from '@/application/ports/adapters/PermissionPort'
import type { ToolCall } from '@/domain/ToolCall'

function createPermissionPort(result: PermissionCheckResult): PermissionPort {
	return {
		check: async () => result,
	}
}

function createToolCall(toolId: string): ToolCall {
	return {
		id: 'call-1',
		sessionId: 'session-1',
		toolId,
		input: {},
		status: 'pending',
		createdAt: '2026-01-01T00:00:00Z',
	}
}

describe('PermissionPolicyAdapter', () => {
	it('returns allow when permission port allows', async () => {
		const adapter = new PermissionPolicyAdapter(
			createPermissionPort({ action: 'allow', reason: null }),
		)
		const result = await adapter.evaluate(createToolCall('bash'))
		expect(result).toBe('allow')
	})

	it('returns deny when permission port denies', async () => {
		const adapter = new PermissionPolicyAdapter(
			createPermissionPort({ action: 'deny', reason: null }),
		)
		const result = await adapter.evaluate(createToolCall('bash'))
		expect(result).toBe('deny')
	})

	it('returns require_approval when permission port requires approval', async () => {
		const adapter = new PermissionPolicyAdapter(
			createPermissionPort({ action: 'require_approval', reason: null }),
		)
		const result = await adapter.evaluate(createToolCall('bash'))
		expect(result).toBe('require_approval')
	})
})
