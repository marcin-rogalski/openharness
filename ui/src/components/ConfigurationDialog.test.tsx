import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type {
	Agent,
	Budget,
	HarnessApi,
	Permission,
	Rule,
} from '@/service/api/HarnessApi'
import ConfigurationDialog from './ConfigurationDialog'

function createApi(overrides: Partial<HarnessApi> = {}): HarnessApi {
	return {
		health: vi.fn(async () => {}),
		listProjects: vi.fn(async () => []),
		createProject: vi.fn(async (name: string) => ({
			id: 'p',
			name,
			status: 'idle' as const,
		})),
		listSessions: vi.fn(async () => []),
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
		createAgent: vi.fn(async (a: Agent) => a),
		updateAgent: vi.fn(async (_id: string, a: Agent) => a),
		listRules: vi.fn(async () => []),
		createRule: vi.fn(async (r: Rule) => r),
		updateRule: vi.fn(async (_id: string, r: Rule) => r),
		listBudgets: vi.fn(async () => []),
		createBudget: vi.fn(async (b: Budget) => b),
		updateBudget: vi.fn(async (_id: string, b: Budget) => b),
		listPermissions: vi.fn(async () => []),
		createPermission: vi.fn(async (p: Permission) => p),
		updatePermission: vi.fn(async (_id: string, p: Permission) => p),
		...overrides,
	}
}

describe('ConfigurationDialog', () => {
	it('renders with the agents tab active by default', async () => {
		render(<ConfigurationDialog api={createApi()} onClose={vi.fn()} />)

		expect(screen.getByTestId('configuration-dialog')).toBeInTheDocument()
		expect(screen.getByTestId('agents-tab')).toBeInTheDocument()
		expect(screen.getByTestId('agents-section')).toBeInTheDocument()
	})

	it('shows empty state when no agents exist', async () => {
		render(<ConfigurationDialog api={createApi()} onClose={vi.fn()} />)

		expect(await screen.findByText('No agents configured.')).toBeInTheDocument()
	})

	it('switches to the rules tab', async () => {
		const user = userEvent.setup()
		render(<ConfigurationDialog api={createApi()} onClose={vi.fn()} />)

		await user.click(screen.getByTestId('rules-tab'))

		expect(screen.getByTestId('rules-section')).toBeInTheDocument()
		expect(screen.getByText('No rules configured.')).toBeInTheDocument()
	})

	it('switches to the budgets tab', async () => {
		const user = userEvent.setup()
		render(<ConfigurationDialog api={createApi()} onClose={vi.fn()} />)

		await user.click(screen.getByTestId('budgets-tab'))

		expect(screen.getByTestId('budgets-section')).toBeInTheDocument()
		expect(screen.getByText('No budgets configured.')).toBeInTheDocument()
	})

	it('switches to the permissions tab', async () => {
		const user = userEvent.setup()
		render(<ConfigurationDialog api={createApi()} onClose={vi.fn()} />)

		await user.click(screen.getByTestId('permissions-tab'))

		expect(screen.getByTestId('permissions-section')).toBeInTheDocument()
		expect(screen.getByText('No permissions configured.')).toBeInTheDocument()
	})

	it('creates an agent through the form', async () => {
		const user = userEvent.setup()
		const api = createApi()
		render(<ConfigurationDialog api={api} onClose={vi.fn()} />)

		await user.click(screen.getByTestId('new-agent'))
		await user.type(screen.getByTestId('agent-name'), 'My Agent')
		await user.type(screen.getByTestId('agent-role'), 'coder')
		await user.click(screen.getByTestId('save-agent'))

		expect(api.createAgent).toHaveBeenCalled()
		expect(await screen.findByTestId('config-status')).toHaveTextContent(
			'Agent created.',
		)
	})

	it('creates a rule through the form', async () => {
		const user = userEvent.setup()
		const api = createApi()
		render(<ConfigurationDialog api={api} onClose={vi.fn()} />)

		await user.click(screen.getByTestId('rules-tab'))
		await user.click(screen.getByTestId('new-rule'))
		await user.type(screen.getByTestId('rule-name'), 'My Rule')
		await user.click(screen.getByTestId('save-rule'))

		expect(api.createRule).toHaveBeenCalled()
		expect(await screen.findByTestId('config-status')).toHaveTextContent(
			'Rule created.',
		)
	})

	it('creates a budget through the form', async () => {
		const user = userEvent.setup()
		const api = createApi()
		render(<ConfigurationDialog api={api} onClose={vi.fn()} />)

		await user.click(screen.getByTestId('budgets-tab'))
		await user.click(screen.getByTestId('new-budget'))
		await user.type(screen.getByTestId('budget-name'), 'My Budget')
		await user.click(screen.getByTestId('save-budget'))

		expect(api.createBudget).toHaveBeenCalled()
		expect(await screen.findByTestId('config-status')).toHaveTextContent(
			'Budget created.',
		)
	})

	it('creates a permission through the form', async () => {
		const user = userEvent.setup()
		const api = createApi()
		render(<ConfigurationDialog api={api} onClose={vi.fn()} />)

		await user.click(screen.getByTestId('permissions-tab'))
		await user.click(screen.getByTestId('new-permission'))
		await user.type(screen.getByTestId('permission-name'), 'My Permission')
		await user.click(screen.getByTestId('save-permission'))

		expect(api.createPermission).toHaveBeenCalled()
		expect(await screen.findByTestId('config-status')).toHaveTextContent(
			'Permission created.',
		)
	})

	it('shows an error when loading fails', async () => {
		const api = createApi({
			listAgents: vi.fn(async () => {
				throw new Error('load boom')
			}),
		})
		render(<ConfigurationDialog api={api} onClose={vi.fn()} />)

		expect(await screen.findByTestId('config-error')).toHaveTextContent(
			'load boom',
		)
	})

	it('shows an error when creating an agent fails', async () => {
		const user = userEvent.setup()
		const api = createApi({
			createAgent: vi.fn(async () => {
				throw new Error('create boom')
			}),
		})
		render(<ConfigurationDialog api={api} onClose={vi.fn()} />)

		await user.click(screen.getByTestId('new-agent'))
		await user.type(screen.getByTestId('agent-name'), 'Fail')
		await user.click(screen.getByTestId('save-agent'))

		expect(await screen.findByTestId('config-error')).toHaveTextContent(
			'create boom',
		)
	})

	it('closes through the close button', async () => {
		const user = userEvent.setup()
		const onClose = vi.fn()
		render(<ConfigurationDialog api={createApi()} onClose={onClose} />)

		await user.click(screen.getByTestId('close-configuration'))

		await waitFor(() => expect(onClose).toHaveBeenCalled())
	})

	it('lists existing agents', async () => {
		const agent: Agent = {
			id: 'a1',
			name: 'Existing',
			role: 'coder',
			description: '',
			tools: [],
			mcpAccess: [],
			memoryAccess: false,
			sandboxPolicy: { level: 'workspace-write', workspaceRoot: '.' },
			budget: {
				id: 'b1',
				name: 'default',
				tokenLimitPerTurn: null,
				tokenLimitPerSession: null,
				costLimitPerTurn: null,
				costLimitPerSession: null,
				enforcementPoint: 'pre_request',
			},
			modelPreferences: { provider: 'openai', model: 'gpt-4o-mini' },
		}
		const api = createApi({
			listAgents: vi.fn(async () => [agent]),
		})
		render(<ConfigurationDialog api={api} onClose={vi.fn()} />)

		expect(await screen.findByText('Existing')).toBeInTheDocument()
	})

	it('lists existing rules', async () => {
		const user = userEvent.setup()
		const rule: Rule = {
			id: 'r1',
			name: 'Existing Rule',
			when: 'tool_call',
			condition: {},
			action: 'deny',
			guard: null,
		}
		const api = createApi({
			listRules: vi.fn(async () => [rule]),
		})
		render(<ConfigurationDialog api={api} onClose={vi.fn()} />)

		await user.click(screen.getByTestId('rules-tab'))
		expect(await screen.findByText('Existing Rule')).toBeInTheDocument()
	})

	it('lists existing budgets', async () => {
		const user = userEvent.setup()
		const budget: Budget = {
			id: 'b1',
			name: 'Existing Budget',
			tokenLimitPerTurn: 500,
			tokenLimitPerSession: null,
			costLimitPerTurn: null,
			costLimitPerSession: null,
			enforcementPoint: 'pre_request',
		}
		const api = createApi({
			listBudgets: vi.fn(async () => [budget]),
		})
		render(<ConfigurationDialog api={api} onClose={vi.fn()} />)

		await user.click(screen.getByTestId('budgets-tab'))
		expect(await screen.findByText('Existing Budget')).toBeInTheDocument()
	})

	it('lists existing permissions', async () => {
		const user = userEvent.setup()
		const permission: Permission = {
			id: 'p1',
			name: 'Existing Permission',
			resource: 'tool',
			resourceId: 'bash',
			action: 'allow',
			scope: 'project',
			scopeId: null,
		}
		const api = createApi({
			listPermissions: vi.fn(async () => [permission]),
		})
		render(<ConfigurationDialog api={api} onClose={vi.fn()} />)

		await user.click(screen.getByTestId('permissions-tab'))
		expect(await screen.findByText('Existing Permission')).toBeInTheDocument()
	})

	it('updates form field values through onChange', async () => {
		const user = userEvent.setup()
		render(<ConfigurationDialog api={createApi()} onClose={vi.fn()} />)

		await user.click(screen.getByTestId('new-agent'))
		await user.clear(screen.getByTestId('agent-name'))
		await user.type(screen.getByTestId('agent-name'), 'Changed')
		expect(screen.getByTestId('agent-name')).toHaveValue('Changed')

		await user.clear(screen.getByTestId('agent-role'))
		await user.type(screen.getByTestId('agent-role'), 'reviewer')
		expect(screen.getByTestId('agent-role')).toHaveValue('reviewer')

		await user.clear(screen.getByTestId('agent-description'))
		await user.type(screen.getByTestId('agent-description'), 'A test agent')
		expect(screen.getByTestId('agent-description')).toHaveValue('A test agent')
	})

	it('updates rule form field values through onChange', async () => {
		const user = userEvent.setup()
		render(<ConfigurationDialog api={createApi()} onClose={vi.fn()} />)

		await user.click(screen.getByTestId('rules-tab'))
		await user.click(screen.getByTestId('new-rule'))
		await user.clear(screen.getByTestId('rule-name'))
		await user.type(screen.getByTestId('rule-name'), 'Changed Rule')
		expect(screen.getByTestId('rule-name')).toHaveValue('Changed Rule')

		await user.selectOptions(screen.getByTestId('rule-when'), 'turn_start')
		expect(screen.getByTestId('rule-when')).toHaveValue('turn_start')

		await user.selectOptions(screen.getByTestId('rule-action'), 'allow')
		expect(screen.getByTestId('rule-action')).toHaveValue('allow')
	})

	it('updates budget form field values through onChange', async () => {
		const user = userEvent.setup()
		render(<ConfigurationDialog api={createApi()} onClose={vi.fn()} />)

		await user.click(screen.getByTestId('budgets-tab'))
		await user.click(screen.getByTestId('new-budget'))
		await user.clear(screen.getByTestId('budget-name'))
		await user.type(screen.getByTestId('budget-name'), 'Changed Budget')
		expect(screen.getByTestId('budget-name')).toHaveValue('Changed Budget')

		await user.clear(screen.getByTestId('budget-token-limit-turn'))
		await user.type(screen.getByTestId('budget-token-limit-turn'), '500')
		expect(screen.getByTestId('budget-token-limit-turn')).toHaveValue(500)

		await user.clear(screen.getByTestId('budget-token-limit-session'))
		await user.type(screen.getByTestId('budget-token-limit-session'), '1000')
		expect(screen.getByTestId('budget-token-limit-session')).toHaveValue(1000)
	})

	it('updates permission form field values through onChange', async () => {
		const user = userEvent.setup()
		render(<ConfigurationDialog api={createApi()} onClose={vi.fn()} />)

		await user.click(screen.getByTestId('permissions-tab'))
		await user.click(screen.getByTestId('new-permission'))
		await user.clear(screen.getByTestId('permission-name'))
		await user.type(screen.getByTestId('permission-name'), 'Changed')
		expect(screen.getByTestId('permission-name')).toHaveValue('Changed')

		await user.selectOptions(
			screen.getByTestId('permission-resource'),
			'sandbox',
		)
		expect(screen.getByTestId('permission-resource')).toHaveValue('sandbox')

		await user.clear(screen.getByTestId('permission-resource-id'))
		await user.type(screen.getByTestId('permission-resource-id'), 'docker')
		expect(screen.getByTestId('permission-resource-id')).toHaveValue('docker')

		await user.selectOptions(
			screen.getByTestId('permission-action'),
			'require_approval',
		)
		expect(screen.getByTestId('permission-action')).toHaveValue(
			'require_approval',
		)

		await user.selectOptions(screen.getByTestId('permission-scope'), 'session')
		expect(screen.getByTestId('permission-scope')).toHaveValue('session')
	})

	it('resets the form through the cancel button', async () => {
		const user = userEvent.setup()
		render(<ConfigurationDialog api={createApi()} onClose={vi.fn()} />)

		await user.click(screen.getByTestId('new-agent'))
		await user.type(screen.getByTestId('agent-name'), 'Test')
		await user.click(screen.getByText('Cancel'))

		expect(screen.queryByTestId('agent-name')).not.toBeInTheDocument()
	})

	it('falls back to a generic message for non-Error load failures', async () => {
		const api = createApi({
			listAgents: vi.fn(async () => {
				throw 'nope'
			}),
		})
		render(<ConfigurationDialog api={api} onClose={vi.fn()} />)

		expect(await screen.findByTestId('config-error')).toHaveTextContent(
			'Failed to load',
		)
	})

	it('falls back to a generic message for non-Error save failures', async () => {
		const user = userEvent.setup()
		const api = createApi({
			createAgent: vi.fn(async () => {
				throw 'nope'
			}),
		})
		render(<ConfigurationDialog api={api} onClose={vi.fn()} />)

		await user.click(screen.getByTestId('new-agent'))
		await user.type(screen.getByTestId('agent-name'), 'Test')
		await user.click(screen.getByTestId('save-agent'))

		expect(await screen.findByTestId('config-error')).toHaveTextContent(
			'Failed',
		)
	})

	it('ignores late API responses after unmount', async () => {
		let resolveAgents: (() => void) | undefined
		const api = createApi({
			listAgents: vi.fn(
				() =>
					new Promise<Agent[]>((resolve) => {
						resolveAgents = () => resolve([])
					}),
			),
		})
		const { unmount } = render(
			<ConfigurationDialog api={api} onClose={vi.fn()} />,
		)

		unmount()
		resolveAgents?.()
		await Promise.resolve()
	})

	it('shows error message when saving a rule fails', async () => {
		const user = userEvent.setup()
		const api = createApi({
			createRule: vi.fn(async () => {
				throw new Error('Rule failed')
			}),
		})
		render(<ConfigurationDialog api={api} onClose={vi.fn()} />)

		await user.click(screen.getByTestId('rules-tab'))
		await user.click(screen.getByTestId('new-rule'))
		await user.type(screen.getByTestId('rule-name'), 'Test')
		await user.click(screen.getByTestId('save-rule'))

		expect(await screen.findByTestId('config-error')).toHaveTextContent(
			'Rule failed',
		)
	})

	it('falls back to generic message for non-Error rule save failures', async () => {
		const user = userEvent.setup()
		const api = createApi({
			createRule: vi.fn(async () => {
				throw 'nope'
			}),
		})
		render(<ConfigurationDialog api={api} onClose={vi.fn()} />)

		await user.click(screen.getByTestId('rules-tab'))
		await user.click(screen.getByTestId('new-rule'))
		await user.type(screen.getByTestId('rule-name'), 'Test')
		await user.click(screen.getByTestId('save-rule'))

		expect(await screen.findByTestId('config-error')).toHaveTextContent(
			'Failed',
		)
	})

	it('shows error message when saving a budget fails', async () => {
		const user = userEvent.setup()
		const api = createApi({
			createBudget: vi.fn(async () => {
				throw new Error('Budget failed')
			}),
		})
		render(<ConfigurationDialog api={api} onClose={vi.fn()} />)

		await user.click(screen.getByTestId('budgets-tab'))
		await user.click(screen.getByTestId('new-budget'))
		await user.type(screen.getByTestId('budget-name'), 'B')
		await user.click(screen.getByTestId('save-budget'))

		expect(await screen.findByTestId('config-error')).toHaveTextContent(
			'Budget failed',
		)
	})

	it('falls back to generic message for non-Error budget save failures', async () => {
		const user = userEvent.setup()
		const api = createApi({
			createBudget: vi.fn(async () => {
				throw 'nope'
			}),
		})
		render(<ConfigurationDialog api={api} onClose={vi.fn()} />)

		await user.click(screen.getByTestId('budgets-tab'))
		await user.click(screen.getByTestId('new-budget'))
		await user.type(screen.getByTestId('budget-name'), 'B')
		await user.click(screen.getByTestId('save-budget'))

		expect(await screen.findByTestId('config-error')).toHaveTextContent(
			'Failed',
		)
	})

	it('shows error message when saving a permission fails', async () => {
		const user = userEvent.setup()
		const api = createApi({
			createPermission: vi.fn(async () => {
				throw new Error('Perm failed')
			}),
		})
		render(<ConfigurationDialog api={api} onClose={vi.fn()} />)

		await user.click(screen.getByTestId('permissions-tab'))
		await user.click(screen.getByTestId('new-permission'))
		await user.type(screen.getByTestId('permission-name'), 'Test')
		await user.click(screen.getByTestId('save-permission'))

		expect(await screen.findByTestId('config-error')).toHaveTextContent(
			'Perm failed',
		)
	})

	it('falls back to generic message for non-Error permission save failures', async () => {
		const user = userEvent.setup()
		const api = createApi({
			createPermission: vi.fn(async () => {
				throw 'nope'
			}),
		})
		render(<ConfigurationDialog api={api} onClose={vi.fn()} />)

		await user.click(screen.getByTestId('permissions-tab'))
		await user.click(screen.getByTestId('new-permission'))
		await user.type(screen.getByTestId('permission-name'), 'Test')
		await user.click(screen.getByTestId('save-permission'))

		expect(await screen.findByTestId('config-error')).toHaveTextContent(
			'Failed',
		)
	})
})
