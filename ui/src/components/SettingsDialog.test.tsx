import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type {
	HarnessApi,
	UpdateConfigInput,
	UpdateConfigResult,
} from '@/service/api/HarnessApi'
import SettingsDialog from './SettingsDialog'

function createApi(overrides: Partial<HarnessApi> = {}): HarnessApi {
	return {
		health: vi.fn(async () => {}),
		listProjects: vi.fn(async () => []),
		sendMessage: vi.fn(async () => []),
		getConfig: vi.fn(async () => ({
			schemaVersion: 1,
			port: 3000,
			projectsDir: '/tmp/projects',
		})),
		updateConfig: vi.fn(async (input: UpdateConfigInput) => ({
			config: {
				schemaVersion: 1,
				port: input.port ?? 3000,
				projectsDir: input.projectsDir ?? '/tmp/projects',
			},
			restartRequired: input.port !== undefined && input.port !== 3000,
		})),
		...overrides,
	} as HarnessApi
}

function createApiFactory(health: () => Promise<void>) {
	return vi.fn(() => ({ health }) as HarnessApi)
}

describe('SettingsDialog', () => {
	it('tests the connection from the connection tab', async () => {
		const user = userEvent.setup()
		const apiFactory = createApiFactory(async () => {})
		render(
			<SettingsDialog
				api={createApi()}
				uiConfig={{ schemaVersion: 1, harnessBaseUrl: '' }}
				onClose={vi.fn()}
				apiFactory={apiFactory}
			/>,
		)

		await user.click(screen.getByTestId('test-connection-settings'))

		expect(await screen.findByTestId('connection-status')).toHaveTextContent(
			'Connection successful',
		)
		expect(apiFactory).toHaveBeenCalledWith('')
	})

	it('shows a connection error when the health check fails', async () => {
		const user = userEvent.setup()
		const apiFactory = createApiFactory(async () => {
			throw new Error('unreachable')
		})
		render(
			<SettingsDialog
				api={createApi()}
				uiConfig={{ schemaVersion: 1, harnessBaseUrl: '' }}
				onClose={vi.fn()}
				apiFactory={apiFactory}
			/>,
		)

		await user.click(screen.getByTestId('test-connection-settings'))

		expect(await screen.findByTestId('connection-error')).toHaveTextContent(
			'unreachable',
		)
	})

	it('saves the UI connection config', async () => {
		const user = userEvent.setup()
		const onUiConfigChange = vi.fn()
		render(
			<SettingsDialog
				api={createApi()}
				uiConfig={{ schemaVersion: 1, harnessBaseUrl: '' }}
				onUiConfigChange={onUiConfigChange}
				onClose={vi.fn()}
			/>,
		)

		await user.type(
			screen.getByTestId('settings-base-url'),
			'http://localhost:4000',
		)
		await user.click(screen.getByTestId('save-connection-settings'))

		expect(onUiConfigChange).toHaveBeenCalledWith({
			schemaVersion: 1,
			harnessBaseUrl: 'http://localhost:4000',
		})
	})

	it('loads and saves the server config', async () => {
		const user = userEvent.setup()
		const api = createApi()
		render(
			<SettingsDialog
				api={api}
				uiConfig={{ schemaVersion: 1, harnessBaseUrl: '' }}
				onClose={vi.fn()}
			/>,
		)

		await user.click(screen.getByTestId('server-tab'))
		expect(await screen.findByTestId('settings-port')).toHaveValue('3000')

		await user.clear(screen.getByTestId('settings-port'))
		await user.type(screen.getByTestId('settings-port'), '4000')
		await user.click(screen.getByTestId('save-server-settings'))

		expect(api.updateConfig).toHaveBeenCalledWith({
			port: 4000,
			projectsDir: '/tmp/projects',
		})
		expect(await screen.findByTestId('server-status')).toHaveTextContent(
			'Restart the harness',
		)
		expect(screen.getByTestId('restart-warning')).toBeInTheDocument()
	})

	it('rejects an invalid port before calling the API', async () => {
		const user = userEvent.setup()
		const api = createApi()
		render(
			<SettingsDialog
				api={api}
				uiConfig={{ schemaVersion: 1, harnessBaseUrl: '' }}
				onClose={vi.fn()}
			/>,
		)

		await user.click(screen.getByTestId('server-tab'))
		await screen.findByTestId('settings-port')
		await user.clear(screen.getByTestId('settings-port'))
		await user.type(screen.getByTestId('settings-port'), 'abc')
		await user.click(screen.getByTestId('save-server-settings'))

		expect(await screen.findByTestId('server-error')).toHaveTextContent(
			'Port must be an integer',
		)
		expect(api.updateConfig).not.toHaveBeenCalled()
	})

	it('closes through the close button', async () => {
		const user = userEvent.setup()
		const onClose = vi.fn()
		render(
			<SettingsDialog
				api={createApi()}
				uiConfig={{ schemaVersion: 1, harnessBaseUrl: '' }}
				onClose={onClose}
			/>,
		)

		await user.click(screen.getByTestId('close-settings'))

		await waitFor(() => expect(onClose).toHaveBeenCalled())
	})

	it('starts from a null UI config', async () => {
		render(
			<SettingsDialog api={createApi()} uiConfig={null} onClose={vi.fn()} />,
		)

		expect(screen.getByTestId('settings-base-url')).toHaveValue('')
	})

	it('shows the working state while a connection test is running', async () => {
		const user = userEvent.setup()
		let resolveHealth: (() => void) | undefined
		const health = () =>
			new Promise<void>((resolve) => {
				resolveHealth = resolve
			})
		const apiFactory = createApiFactory(health)
		render(
			<SettingsDialog
				api={createApi()}
				uiConfig={{ schemaVersion: 1, harnessBaseUrl: '' }}
				onClose={vi.fn()}
				apiFactory={apiFactory}
			/>,
		)

		await user.click(screen.getByTestId('test-connection-settings'))

		expect(screen.getByTestId('connection-status')).toHaveTextContent(
			'Testing connection...',
		)
		resolveHealth?.()
		expect(await screen.findByText('Connection successful')).toBeInTheDocument()
	})

	it('falls back to a generic connection error for non-Error failures', async () => {
		const user = userEvent.setup()
		const apiFactory = createApiFactory(async () => {
			throw 'nope'
		})
		render(
			<SettingsDialog
				api={createApi()}
				uiConfig={{ schemaVersion: 1, harnessBaseUrl: '' }}
				onClose={vi.fn()}
				apiFactory={apiFactory}
			/>,
		)

		await user.click(screen.getByTestId('test-connection-settings'))

		expect(await screen.findByTestId('connection-error')).toHaveTextContent(
			'Connection failed',
		)
	})

	it('ignores saving the UI config when no callback is provided', async () => {
		const user = userEvent.setup()
		render(
			<SettingsDialog
				api={createApi()}
				uiConfig={{ schemaVersion: 1, harnessBaseUrl: '' }}
				onClose={vi.fn()}
			/>,
		)

		await user.click(screen.getByTestId('save-connection-settings'))

		expect(screen.getByTestId('settings-base-url')).toBeInTheDocument()
	})

	it('shows a server load error when getConfig fails', async () => {
		const user = userEvent.setup()
		const api = createApi({
			getConfig: vi.fn(async () => {
				throw new Error('config boom')
			}),
		})
		render(
			<SettingsDialog
				api={api}
				uiConfig={{ schemaVersion: 1, harnessBaseUrl: '' }}
				onClose={vi.fn()}
			/>,
		)

		await user.click(screen.getByTestId('server-tab'))

		expect(await screen.findByTestId('server-error')).toHaveTextContent(
			'config boom',
		)
	})

	it('saves the same port without a restart warning', async () => {
		const user = userEvent.setup()
		const api = createApi()
		render(
			<SettingsDialog
				api={api}
				uiConfig={{ schemaVersion: 1, harnessBaseUrl: '' }}
				onClose={vi.fn()}
			/>,
		)

		await user.click(screen.getByTestId('server-tab'))
		await screen.findByTestId('settings-port')
		await user.click(screen.getByTestId('save-server-settings'))

		expect(api.updateConfig).toHaveBeenCalledWith({
			port: 3000,
			projectsDir: '/tmp/projects',
		})
		expect(await screen.findByTestId('server-status')).toHaveTextContent(
			'Saved.',
		)
		expect(screen.queryByTestId('restart-warning')).not.toBeInTheDocument()
	})

	it('shows the working state while saving server config', async () => {
		const user = userEvent.setup()
		let resolveUpdate: (() => void) | undefined
		const api = createApi({
			updateConfig: vi.fn(
				() =>
					new Promise<UpdateConfigResult>((resolve) => {
						resolveUpdate = () => {
							resolve({
								config: {
									schemaVersion: 1,
									port: 3000,
									projectsDir: '/tmp/projects',
								},
								restartRequired: false,
							})
						}
					}),
			),
		})
		render(
			<SettingsDialog
				api={api}
				uiConfig={{ schemaVersion: 1, harnessBaseUrl: '' }}
				onClose={vi.fn()}
			/>,
		)

		await user.click(screen.getByTestId('server-tab'))
		await screen.findByTestId('settings-port')
		await user.click(screen.getByTestId('save-server-settings'))

		expect(screen.getByTestId('server-status')).toHaveTextContent('Saving...')
		resolveUpdate?.()
		expect(await screen.findByText('Saved.')).toBeInTheDocument()
	})

	it('falls back to a generic server save error for non-Error failures', async () => {
		const user = userEvent.setup()
		const api = createApi({
			updateConfig: vi.fn(async () => {
				throw 'save boom'
			}),
		})
		render(
			<SettingsDialog
				api={api}
				uiConfig={{ schemaVersion: 1, harnessBaseUrl: '' }}
				onClose={vi.fn()}
			/>,
		)

		await user.click(screen.getByTestId('server-tab'))
		await screen.findByTestId('settings-port')
		await user.click(screen.getByTestId('save-server-settings'))

		expect(await screen.findByTestId('server-error')).toHaveTextContent(
			'Failed to save config',
		)
	})

	it('rejects an empty projects directory before calling the API', async () => {
		const user = userEvent.setup()
		const api = createApi()
		render(
			<SettingsDialog
				api={api}
				uiConfig={{ schemaVersion: 1, harnessBaseUrl: '' }}
				onClose={vi.fn()}
			/>,
		)

		await user.click(screen.getByTestId('server-tab'))
		await screen.findByTestId('settings-port')
		await user.clear(screen.getByTestId('settings-projects-dir'))
		await user.click(screen.getByTestId('save-server-settings'))

		expect(await screen.findByTestId('server-error')).toHaveTextContent(
			'Projects directory must not be empty',
		)
		expect(api.updateConfig).not.toHaveBeenCalled()
	})
})
