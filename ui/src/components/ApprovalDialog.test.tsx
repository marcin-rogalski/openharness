import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { GlobalProvider } from '@/service/GlobalService'
import { emptyState } from '@/service/initialState'
import type { GlobalState } from '@/service/schema'
import ApprovalDialog from './ApprovalDialog'

function createApi() {
	return {
		health: vi.fn(async () => {}),
		listProjects: vi.fn(async () => []),
		createProject: vi.fn(async (name: string) => ({
			id: 'p',
			name,
			status: 'idle' as const,
		})),
		deleteProject: vi.fn(async () => {}),
		listSessions: vi.fn(async () => []),
		createSession: vi.fn(async (projectId: string) => ({
			id: 's',
			projectId,
			status: 'active' as const,
			createdAt: new Date().toISOString(),
			endedAt: null,
		})),
		deleteSession: vi.fn(async () => {}),
		stopSession: vi.fn(async () => {}),
		sendMessage: vi.fn(async () => ({ sessionId: 's', events: [] })),
		getConfig: vi.fn(async () => ({
			schemaVersion: 1 as const,
			port: 3000,
			projectsDir: '/tmp/projects',
			providers: {
				openai: {
					url: 'https://api.openai.com/v1',
					models: { 'gpt-4o-mini': { label: 'GPT-4o Mini' } },
				},
			},
			defaultModel: 'openai/gpt-4o-mini',
		})),
		updateConfig: vi.fn(async (input) => ({
			config: {
				schemaVersion: 1 as const,
				port: input.port ?? 3000,
				projectsDir: input.projectsDir ?? '/tmp/projects',
				providers: {
					openai: {
						url: 'https://api.openai.com/v1',
						models: { 'gpt-4o-mini': { label: 'GPT-4o Mini' } },
					},
				},
				defaultModel: 'openai/gpt-4o-mini',
			},
			restartRequired: false,
		})),
		approveToolCall: vi.fn(async () => {}),
		denyToolCall: vi.fn(async () => {}),
		subscribeToEvents: vi.fn(() => () => {}),
		listAgents: vi.fn(async () => []),
		createAgent: vi.fn(async (a) => a),
		updateAgent: vi.fn(async (_id: string, a) => a),
		listRules: vi.fn(async () => []),
		createRule: vi.fn(async (r) => r),
		updateRule: vi.fn(async (_id: string, r) => r),
		listBudgets: vi.fn(async () => []),
		createBudget: vi.fn(async (b) => b),
		updateBudget: vi.fn(async (_id: string, b) => b),
		listPermissions: vi.fn(async () => []),
		createPermission: vi.fn(async (p) => p),
		updatePermission: vi.fn(async (_id: string, p) => p),
	}
}

function renderDialog(state: GlobalState = emptyState) {
	const api = createApi()
	return {
		api,
		...render(
			<GlobalProvider initialState={state} api={api}>
				<ApprovalDialog />
			</GlobalProvider>,
		),
	}
}

describe('ApprovalDialog', () => {
	it('renders nothing when there is no pending approval', () => {
		renderDialog()

		expect(screen.queryByTestId('approval-dialog')).not.toBeInTheDocument()
	})

	it('renders the approval dialog when there is a pending approval', () => {
		const state: GlobalState = {
			...emptyState,
			pendingApproval: { toolCallId: 'tc-1', tool: 'bash', input: 'ls -la' },
		}

		renderDialog(state)

		expect(screen.getByTestId('approval-dialog')).toBeInTheDocument()
		expect(screen.getByTestId('approval-tool')).toHaveTextContent('bash')
		expect(screen.getByTestId('approval-input')).toHaveTextContent('ls -la')
	})

	it('calls approveToolCall when the approve button is clicked', async () => {
		const user = userEvent.setup()
		const state: GlobalState = {
			...emptyState,
			pendingApproval: { toolCallId: 'tc-1', tool: 'bash', input: 'ls' },
		}
		const { api } = renderDialog(state)

		await user.click(screen.getByTestId('approve-button'))

		expect(api.approveToolCall).toHaveBeenCalledWith('tc-1')
	})

	it('calls denyToolCall when the deny button is clicked', async () => {
		const user = userEvent.setup()
		const state: GlobalState = {
			...emptyState,
			pendingApproval: { toolCallId: 'tc-1', tool: 'bash', input: 'ls' },
		}
		const { api } = renderDialog(state)

		await user.click(screen.getByTestId('deny-button'))

		expect(api.denyToolCall).toHaveBeenCalledWith('tc-1')
	})
})
