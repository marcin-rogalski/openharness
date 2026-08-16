import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { HarnessApi } from '@/service/api/HarnessApi'
import ConnectionPrompt from './ConnectionPrompt'

function createApiFactory(health: () => Promise<void>) {
	return vi.fn(() => ({ health }) as HarnessApi)
}

describe('ConnectionPrompt', () => {
	it('prefills the default harness base URL', () => {
		render(<ConnectionPrompt onConnect={vi.fn()} />)

		expect(screen.getByTestId('harness-base-url')).toHaveValue(
			'http://localhost:3000',
		)
	})

	it('connects when the health check succeeds', async () => {
		const user = userEvent.setup()
		const onConnect = vi.fn()
		const apiFactory = createApiFactory(async () => {})
		render(<ConnectionPrompt onConnect={onConnect} apiFactory={apiFactory} />)

		await user.clear(screen.getByTestId('harness-base-url'))
		await user.click(screen.getByTestId('test-connection'))

		await waitFor(() => expect(onConnect).toHaveBeenCalledWith(''))
		expect(apiFactory).toHaveBeenCalledWith('')
	})

	it('shows an error when the health check fails', async () => {
		const user = userEvent.setup()
		const onConnect = vi.fn()
		const apiFactory = createApiFactory(async () => {
			throw new Error('unreachable')
		})
		render(<ConnectionPrompt onConnect={onConnect} apiFactory={apiFactory} />)

		await user.click(screen.getByTestId('test-connection'))

		expect(await screen.findByTestId('connection-error')).toHaveTextContent(
			'unreachable',
		)
		expect(onConnect).not.toHaveBeenCalled()
	})

	it('falls back to a generic error for non-Error failures', async () => {
		const user = userEvent.setup()
		const onConnect = vi.fn()
		const apiFactory = createApiFactory(async () => {
			throw 'nope'
		})
		render(<ConnectionPrompt onConnect={onConnect} apiFactory={apiFactory} />)

		await user.click(screen.getByTestId('test-connection'))

		expect(await screen.findByTestId('connection-error')).toHaveTextContent(
			'Connection failed',
		)
	})

	it('shows the working state while the health check is running', async () => {
		const user = userEvent.setup()
		const onConnect = vi.fn()
		let resolveHealth: (() => void) | undefined
		const apiFactory = createApiFactory(
			() =>
				new Promise<void>((resolve) => {
					resolveHealth = resolve
				}),
		)
		render(<ConnectionPrompt onConnect={onConnect} apiFactory={apiFactory} />)

		await user.click(screen.getByTestId('test-connection'))

		expect(screen.getByTestId('connection-status')).toHaveTextContent(
			'Testing connection...',
		)
		resolveHealth?.()
		expect(await screen.findByText('Connection successful')).toBeInTheDocument()
	})

	it('uses the default API factory when none is provided', async () => {
		const user = userEvent.setup()
		const onConnect = vi.fn()
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({ status: 'ok' }),
		})
		vi.stubGlobal('fetch', fetchMock)
		render(<ConnectionPrompt onConnect={onConnect} />)

		await user.click(screen.getByTestId('test-connection'))

		await waitFor(() => expect(onConnect).toHaveBeenCalled())
		expect(fetchMock).toHaveBeenCalledWith(
			'http://localhost:3000/api/health',
			expect.anything(),
		)
		vi.unstubAllGlobals()
	})
})
