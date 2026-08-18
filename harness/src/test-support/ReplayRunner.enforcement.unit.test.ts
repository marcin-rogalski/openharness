import { describe, expect, it } from 'vitest'
import type { HookContext, HookResult } from '@/domain/Hook'
import type { Project } from '@/domain/Project'
import type { ToolDefinition } from '@/domain/ToolDefinition'
import type { ToolResult } from '@/domain/ToolResult'
import type { HookPort } from '@/application/ports/adapters/HookPort'
import type { PolicyPort } from '@/application/ports/adapters/PolicyPort'
import type { ToolRegistryPort } from '@/application/ports/adapters/ToolRegistryPort'
import type { ToolExecutorPort } from '@/application/ports/adapters/ToolExecutorPort'
import type { Permission } from '@/domain/Permission'
import InMemoryPermissionAdapter from '@/infrastructure/driven/InMemoryPermissionAdapter'
import PermissionPolicyAdapter from '@/infrastructure/driven/PermissionPolicyAdapter'
import type { ReplayFixture } from './FixtureSchema'
import ReplayRunner from './ReplayRunner'

const testProject: Project = {
	id: 'project-1',
	name: 'Test Project',
	status: 'idle',
}

function createFixture(turns: ReplayFixture['turns']): ReplayFixture {
	return { name: 'enforcement-test', turns }
}

class DenyHook implements HookPort {
	readonly id = 'test-deny-hook'
	readonly priority = 10

	constructor(private readonly reason: string) {}

	async invoke(_context: HookContext, _payload: unknown): Promise<HookResult> {
		return {
			decision: 'deny',
			annotations: [],
			reason: this.reason,
		}
	}
}

class ConditionalDenyHook implements HookPort {
	readonly id = 'conditional-rule-hook'
	readonly priority = 10

	constructor(private readonly denyReason: string) {}

	async invoke(_context: HookContext, _payload: unknown): Promise<HookResult> {
		return {
			decision: 'deny',
			annotations: [],
			reason: this.denyReason,
		}
	}
}

class RestrictedToolRegistry implements ToolRegistryPort, ToolExecutorPort {
	constructor(private readonly tools: ToolDefinition[]) {}

	async listTools(): Promise<ToolDefinition[]> {
		return this.tools
	}

	async getTool(toolId: string): Promise<ToolDefinition | null> {
		return this.tools.find((t) => t.id === toolId) ?? null
	}

	async execute(
		toolId: string,
		input: Record<string, unknown>,
	): Promise<ToolResult> {
		return {
			toolCallId: '',
			status: 'success',
			output: { echoed: input, tool: toolId },
			error: null,
			frozen: false,
		}
	}
}

describe('ReplayRunner enforcement', () => {
	describe('permission checks', () => {
		it('denies a tool call when permission is set to deny', async () => {
			const fixture = createFixture([
				{
					thinking: null,
					toolCalls: [{ tool: 'mock_tool', input: '{"action":"test"}' }],
					response: '',
				},
				{
					thinking: null,
					toolCalls: [],
					response: 'The tool was denied.',
				},
			])

			const permission: Permission = {
				id: 'perm-1',
				name: 'Deny mock_tool',
				resource: 'tool',
				resourceId: 'mock_tool',
				action: 'deny',
				scope: 'project',
				scopeId: null,
			}

			const permissionAdapter = new InMemoryPermissionAdapter([permission])
			const policy = new PermissionPolicyAdapter(permissionAdapter)

			const runner = new ReplayRunner(fixture, testProject, { policy })
			const result = await runner.send('Use the tool')

			const toolResultEvent = result.events.find(
				(e) => e.type === 'tool_result_produced',
			)
			expect(toolResultEvent).toBeDefined()
			expect(toolResultEvent!.payload.status).toBe('error')
			expect(toolResultEvent!.payload.error).toBe('Tool call denied by policy')
		})

		it('allows a tool call when no permission restricts it', async () => {
			const fixture = createFixture([
				{
					thinking: null,
					toolCalls: [{ tool: 'mock_tool', input: '{"action":"test"}' }],
					response: '',
				},
				{
					thinking: null,
					toolCalls: [],
					response: 'Done.',
				},
			])

			const permissionAdapter = new InMemoryPermissionAdapter([])
			const policy = new PermissionPolicyAdapter(permissionAdapter)

			const runner = new ReplayRunner(fixture, testProject, { policy })
			const result = await runner.send('Use the tool')

			const toolResultEvent = result.events.find(
				(e) => e.type === 'tool_result_produced',
			)
			expect(toolResultEvent).toBeDefined()
			expect(toolResultEvent!.payload.status).toBe('success')
		})

		it('enforces project-level deny through the full pipeline', async () => {
			const fixture = createFixture([
				{
					thinking: null,
					toolCalls: [{ tool: 'mock_tool', input: '{}' }],
					response: '',
				},
				{
					thinking: null,
					toolCalls: [],
					response: 'The tool was blocked.',
				},
			])

			const permissions: Permission[] = [
				{
					id: 'perm-1',
					name: 'Block mock_tool',
					resource: 'tool',
					resourceId: 'mock_tool',
					action: 'deny',
					scope: 'project',
					scopeId: null,
				},
			]

			const permissionAdapter = new InMemoryPermissionAdapter(permissions)
			const policy = new PermissionPolicyAdapter(permissionAdapter)

			const runner = new ReplayRunner(fixture, testProject, { policy })
			const result = await runner.send('Use the tool')

			const toolResultEvent = result.events.find(
				(e) => e.type === 'tool_result_produced',
			)
			expect(toolResultEvent).toBeDefined()
			expect(toolResultEvent!.payload.status).toBe('error')
			expect(toolResultEvent!.payload.error).toBe('Tool call denied by policy')

			const turnEnded = result.events.find((e) => e.type === 'turn_ended')
			expect(turnEnded).toBeDefined()
			expect(turnEnded!.payload.reason).toBe('completed')
		})
	})

	describe('budget enforcement', () => {
		it('blocks the turn when a budget hook denies', async () => {
			const fixture = createFixture([
				{
					thinking: null,
					toolCalls: [],
					response: 'This should not be reached.',
				},
			])

			const budgetHook = new DenyHook(
				'Turn token limit exceeded: 150/100',
			)

			const runner = new ReplayRunner(fixture, testProject, {
				hooks: [budgetHook],
			})
			const result = await runner.send('Consume budget')

			const turnEnded = result.events.find((e) => e.type === 'turn_ended')
			expect(turnEnded).toBeDefined()
			expect(turnEnded!.payload.reason).toBe('blocked')
			expect(turnEnded!.payload.deniedBy).toBe('test-deny-hook')
			expect(turnEnded!.payload.hookReason).toBe(
				'Turn token limit exceeded: 150/100',
			)
		})

		it('produces no model_output_received when blocked at step start', async () => {
			const fixture = createFixture([
				{
					thinking: null,
					toolCalls: [],
					response: 'Should not appear.',
				},
			])

			const budgetHook = new DenyHook('Session budget exhausted')
			const runner = new ReplayRunner(fixture, testProject, {
				hooks: [budgetHook],
			})
			const result = await runner.send('Message')

			const modelEvents = result.events.filter(
				(e) => e.type === 'model_output_received',
			)
			expect(modelEvents).toHaveLength(0)
		})
	})

	describe('rule-triggered actions', () => {
		it('blocks the turn when a rule hook denies at step start', async () => {
			const fixture = createFixture([
				{
					thinking: null,
					toolCalls: [],
					response: 'Should not appear.',
				},
			])

			const ruleHook = new ConditionalDenyHook(
				'Rule "no-weekend-deploys" triggered: deployment forbidden on weekends',
			)

			const runner = new ReplayRunner(fixture, testProject, {
				hooks: [ruleHook],
			})
			const result = await runner.send('Deploy the app')

			const turnEnded = result.events.find((e) => e.type === 'turn_ended')
			expect(turnEnded).toBeDefined()
			expect(turnEnded!.payload.reason).toBe('blocked')
			expect(turnEnded!.payload.deniedBy).toBe('conditional-rule-hook')
			expect(turnEnded!.payload.hookReason).toContain('no-weekend-deploys')
		})

		it('allows the turn when no rule hooks are registered', async () => {
			const fixture = createFixture([
				{
					thinking: null,
					toolCalls: [],
					response: 'Hello!',
				},
			])

			const runner = new ReplayRunner(fixture, testProject)
			const result = await runner.send('Hi')

			const turnEnded = result.events.find((e) => e.type === 'turn_ended')
			expect(turnEnded).toBeDefined()
			expect(turnEnded!.payload.reason).toBe('completed')
		})
	})

	describe('preset-selected tools', () => {
		it('only exposes configured tools to the agent', async () => {
			const allowedTool: ToolDefinition = {
				id: 'safe_tool',
				name: 'Safe Tool',
				description: 'A safe tool',
				inputSchema: { type: 'object' },
				sandboxLevel: 'none',
			}

			const registry = new RestrictedToolRegistry([allowedTool])

			const fixture = createFixture([
				{
					thinking: null,
					toolCalls: [{ tool: 'safe_tool', input: '{"x":1}' }],
					response: '',
				},
				{
					thinking: null,
					toolCalls: [],
					response: 'Safe tool executed.',
				},
			])

			const runner = new ReplayRunner(fixture, testProject, {
				toolRegistry: registry,
				executor: registry,
			})
			const result = await runner.send('Use safe tool')

			const toolResultEvent = result.events.find(
				(e) => e.type === 'tool_result_produced',
			)
			expect(toolResultEvent).toBeDefined()
			expect(toolResultEvent!.payload.status).toBe('success')
		})

		it('fails when the agent calls a tool not in its preset', async () => {
			const allowedTool: ToolDefinition = {
				id: 'safe_tool',
				name: 'Safe Tool',
				description: 'A safe tool',
				inputSchema: { type: 'object' },
				sandboxLevel: 'none',
			}

			const registry = new RestrictedToolRegistry([allowedTool])

			const fixture = createFixture([
				{
					thinking: null,
					toolCalls: [{ tool: 'dangerous_tool', input: '{}' }],
					response: '',
				},
				{
					thinking: null,
					toolCalls: [],
					response: 'The tool was not available.',
				},
			])

			const runner = new ReplayRunner(fixture, testProject, {
				toolRegistry: registry,
				executor: registry,
			})
			const result = await runner.send('Use dangerous tool')

			const toolResultEvent = result.events.find(
				(e) => e.type === 'tool_result_produced',
			)
			expect(toolResultEvent).toBeDefined()
			expect(toolResultEvent!.payload.status).toBe('error')
			expect(toolResultEvent!.payload.error).toBe(
				'Tool not found: dangerous_tool',
			)
		})
	})
})
