import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { HarnessApi, UpdateConfigInput } from '@/service/api/HarnessApi'
import { UI_CONFIG_STORAGE_KEY } from '@/service/config/UiConfig'
import Root from './Root'

function createApi(overrides: Partial<HarnessApi> = {}): HarnessApi {
	return {
		health: vi.fn(async () => {}),
		listProjects: vi.fn(async () => [
			{ id: 'project-1', name: 'OpenHarness', status: 'running' },
		]),
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

describe('Root', () => {
	afterEach(() => {
		window.localStorage.clear()
	})

	it('shows the connection prompt when no UI config exists', () => {
		render(<Root apiFactory={vi.fn(() => createApi())} />)

		expect(screen.getByTestId('connection-prompt')).toBeInTheDocument()
	})

	it('saves the UI config and renders the app after a successful connection', async () => {
		const user = userEvent.setup()
		const apiFactory = vi.fn(() => createApi())
		render(<Root apiFactory={apiFactory} />)

		await user.click(screen.getByTestId('test-connection'))

		expect(
			await screen.findByRole('heading', { name: 'OpenHarness' }),
		).toBeInTheDocument()
		expect(
			JSON.parse(window.localStorage.getItem(UI_CONFIG_STORAGE_KEY) ?? ''),
		).toEqual({ schemaVersion: 1, harnessBaseUrl: 'http://localhost:3000' })
	})

	it('renders the app when a UI config already exists', async () => {
		window.localStorage.setItem(
			UI_CONFIG_STORAGE_KEY,
			JSON.stringify({
				schemaVersion: 1,
				harnessBaseUrl: 'http://localhost:3000',
			}),
		)
		const apiFactory = vi.fn(() => createApi())
		render(<Root apiFactory={apiFactory} />)

		expect(
			await screen.findByRole('heading', { name: 'OpenHarness' }),
		).toBeInTheDocument()
		expect(apiFactory).toHaveBeenCalledWith('http://localhost:3000')
	})

	it('updates the UI config from the settings dialog', async () => {
		const user = userEvent.setup()
		window.localStorage.setItem(
			UI_CONFIG_STORAGE_KEY,
			JSON.stringify({
				schemaVersion: 1,
				harnessBaseUrl: '',
			}),
		)
		const apiFactory = vi.fn(() => createApi())
		render(<Root apiFactory={apiFactory} />)

		await user.click(await screen.findByTestId('open-settings'))
		await user.type(
			screen.getByTestId('settings-base-url'),
			'http://localhost:4000',
		)
		await user.click(screen.getByTestId('save-connection-settings'))

		await waitFor(() =>
			expect(
				JSON.parse(window.localStorage.getItem(UI_CONFIG_STORAGE_KEY) ?? ''),
			).toEqual({
				schemaVersion: 1,
				harnessBaseUrl: 'http://localhost:4000',
			}),
		)
		expect(apiFactory).toHaveBeenCalledWith('http://localhost:4000')
	})
})
