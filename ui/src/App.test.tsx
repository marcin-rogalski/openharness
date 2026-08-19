import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '@/App'
import { createMockHarnessApi } from '@/service/api/MockHarnessApi'
import type { UiConfig } from '@/service/config/UiConfig'
import { GlobalProvider } from '@/service/GlobalService'
import { mockState } from '@/service/mock'
import type { GlobalState } from '@/service/schema'

function renderApp(
	initialState: GlobalState = mockState,
	api = createMockHarnessApi(),
	uiConfig: UiConfig | null = null,
) {
	return render(
		<GlobalProvider initialState={initialState} api={api}>
			<App api={api} uiConfig={uiConfig} />
		</GlobalProvider>,
	)
}

describe('App', () => {
	it('renders the project list from the global service', () => {
		renderApp()

		expect(
			screen.getByRole('heading', { name: 'OpenHarness' }),
		).toBeInTheDocument()
		const projectNames = screen.getAllByTestId('project-name')
		expect(projectNames).toHaveLength(2)
		expect(projectNames[0]).toHaveTextContent('OpenHarness')
		expect(projectNames[1]).toHaveTextContent('Tempo')
		expect(screen.getByTestId('selected-project')).toHaveTextContent(
			'No project selected',
		)
	})

	it('selects a project through the global service', async () => {
		const user = userEvent.setup()
		renderApp()

		await user.click(screen.getAllByTestId('select-project')[0])

		expect(screen.getByTestId('selected-project')).toHaveTextContent(
			'Selected: OpenHarness',
		)
		expect(screen.getByTestId('message-input')).toBeInTheDocument()
	})

	it('shows an empty state when there are no projects', () => {
		renderApp(
			{
				projects: [],
				selectedProjectId: null,
				sessions: [],
				sessionId: null,
				timeline: [],
				error: null,
				pendingApproval: null,
			},
			{
				health: async () => {},
				listProjects: async () => [],
				listSessions: async () => [],
				sendMessage: async () => ({ sessionId: 's', events: [] }),
				getConfig: async () => ({
					schemaVersion: 1,
					port: 3000,
					projectsDir: '/tmp/projects',
					providers: {
						openai: {
							url: 'https://api.openai.com/v1',
							models: { 'gpt-4o-mini': { label: 'GPT-4o Mini' } },
						},
					},
					defaultModel: 'openai/gpt-4o-mini',
				}),
				updateConfig: async (input) => ({
					config: {
						schemaVersion: 1,
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
					restartRequired: input.port !== undefined && input.port !== 3000,
				}),
				approveToolCall: async () => {},
				denyToolCall: async () => {},
				subscribeToEvents: () => () => {},
				listAgents: async () => [],
				createAgent: async (a) => a,
				updateAgent: async (_id, a) => a,
				listRules: async () => [],
				createRule: async (r) => r,
				updateRule: async (_id, r) => r,
				listBudgets: async () => [],
				createBudget: async (b) => b,
				updateBudget: async (_id, b) => b,
				listPermissions: async () => [],
				createPermission: async (p) => p,
				updatePermission: async (_id, p) => p,
			},
		)

		expect(screen.getByText('No projects')).toBeInTheDocument()
		expect(screen.queryByTestId('select-project')).not.toBeInTheDocument()
	})

	it('shows an error banner when the global state has an error', () => {
		renderApp({
			...mockState,
			error: 'Failed to load projects',
		})

		expect(screen.getByTestId('error-banner')).toHaveTextContent(
			'Failed to load projects',
		)
	})

	it('opens the settings dialog when an API is available', async () => {
		const user = userEvent.setup()
		renderApp(mockState, createMockHarnessApi(), {
			schemaVersion: 1,
			harnessBaseUrl: '',
		})

		await user.click(screen.getByTestId('open-settings'))

		expect(await screen.findByTestId('settings-dialog')).toBeInTheDocument()
	})

	it('closes the settings dialog', async () => {
		const user = userEvent.setup()
		renderApp(mockState, createMockHarnessApi(), {
			schemaVersion: 1,
			harnessBaseUrl: '',
		})

		await user.click(screen.getByTestId('open-settings'))
		await user.click(await screen.findByTestId('close-settings'))

		expect(screen.queryByTestId('settings-dialog')).not.toBeInTheDocument()
	})
})
