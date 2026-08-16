import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createMockHarnessApi } from './api/MockHarnessApi'
import { GlobalProvider, useGlobal } from './GlobalService'
import { emptyState } from './initialState'
import { mockState } from './mock'
import type { GlobalState, Project } from './schema'

function Probe() {
	const { state, actions } = useGlobal()

	return (
		<div>
			<span data-testid="project-count">{state.projects.length}</span>
			<span data-testid="selected-project">
				{state.selectedProjectId ?? 'none'}
			</span>
			<span data-testid="timeline-count">{state.timeline.length}</span>
			<span data-testid="error">{state.error ?? 'none'}</span>
			<button
				type="button"
				data-testid="select-project"
				onClick={() => actions.selectProject('project-1')}
			>
				Select
			</button>
			<button
				type="button"
				data-testid="send-message"
				onClick={() => void actions.sendMessage('Hello')}
			>
				Send
			</button>
		</div>
	)
}

describe('GlobalService', () => {
	it('loads projects from the API on mount', async () => {
		render(
			<GlobalProvider initialState={emptyState} api={createMockHarnessApi()}>
				<Probe />
			</GlobalProvider>,
		)

		expect(await screen.findByTestId('project-count')).toHaveTextContent('2')
	})

	it('exposes validated global state and actions', async () => {
		const user = userEvent.setup()
		render(
			<GlobalProvider initialState={mockState} api={createMockHarnessApi()}>
				<Probe />
			</GlobalProvider>,
		)

		expect(screen.getByTestId('project-count')).toHaveTextContent('2')
		expect(screen.getByTestId('selected-project')).toHaveTextContent('none')

		await user.click(screen.getByTestId('select-project'))

		expect(screen.getByTestId('selected-project')).toHaveTextContent(
			'project-1',
		)
	})

	it('throws when used outside the provider', () => {
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

		expect(() => render(<Probe />)).toThrow(
			'useGlobal must be used within a GlobalProvider',
		)

		consoleError.mockRestore()
	})

	it('updates projects through actions', async () => {
		const user = userEvent.setup()
		render(
			<GlobalProvider initialState={mockState} api={createMockHarnessApi()}>
				<ProjectSetter />
			</GlobalProvider>,
		)

		await user.click(screen.getByTestId('clear-projects'))

		expect(screen.getByTestId('project-count')).toHaveTextContent('0')
	})

	it('appends API timeline entries when a project is selected', async () => {
		const user = userEvent.setup()
		render(
			<GlobalProvider initialState={mockState} api={createMockHarnessApi()}>
				<Probe />
			</GlobalProvider>,
		)

		await user.click(screen.getByTestId('select-project'))
		await user.click(screen.getByTestId('send-message'))

		await waitFor(() =>
			expect(screen.getByTestId('timeline-count')).toHaveTextContent('5'),
		)
	})

	it('ignores messages when no project is selected', async () => {
		const user = userEvent.setup()
		render(
			<GlobalProvider initialState={mockState} api={createMockHarnessApi()}>
				<Probe />
			</GlobalProvider>,
		)

		await user.click(screen.getByTestId('send-message'))

		expect(screen.getByTestId('timeline-count')).toHaveTextContent('0')
	})

	it('shows an error when listing projects fails', async () => {
		const api = {
			health: vi.fn(),
			listProjects: vi.fn().mockRejectedValue(new Error('boom')),
			sendMessage: vi.fn(),
			getConfig: vi.fn(),
			updateConfig: vi.fn(),
		}

		render(
			<GlobalProvider initialState={emptyState} api={api}>
				<Probe />
			</GlobalProvider>,
		)

		expect(await screen.findByTestId('error')).toHaveTextContent('boom')
	})

	it('shows an error when sending a message fails', async () => {
		const user = userEvent.setup()
		const api = {
			health: vi.fn(),
			listProjects: vi.fn().mockResolvedValue(mockState.projects),
			sendMessage: vi.fn().mockRejectedValue(new Error('send boom')),
			getConfig: vi.fn(),
			updateConfig: vi.fn(),
		}
		const state: GlobalState = {
			...mockState,
			selectedProjectId: 'project-1',
		}

		render(
			<GlobalProvider initialState={state} api={api}>
				<Probe />
			</GlobalProvider>,
		)

		await user.click(screen.getByTestId('select-project'))
		await user.click(screen.getByTestId('send-message'))

		expect(await screen.findByTestId('error')).toHaveTextContent('send boom')
	})

	it('falls back to a generic message for non-Error list failures', async () => {
		const api = {
			health: vi.fn(),
			listProjects: vi.fn().mockRejectedValue('boom'),
			sendMessage: vi.fn(),
			getConfig: vi.fn(),
			updateConfig: vi.fn(),
		}

		render(
			<GlobalProvider initialState={emptyState} api={api}>
				<Probe />
			</GlobalProvider>,
		)

		expect(await screen.findByTestId('error')).toHaveTextContent(
			'Failed to load projects',
		)
	})

	it('ignores late project updates after unmount', async () => {
		let resolveProjects: (() => void) | undefined
		const api = {
			health: vi.fn(),
			listProjects: vi.fn(
				() =>
					new Promise<Project[]>((resolve) => {
						resolveProjects = () => {
							resolve([{ id: 'late', name: 'Late', status: 'idle' }])
						}
					}),
			),
			sendMessage: vi.fn(),
			getConfig: vi.fn(),
			updateConfig: vi.fn(),
		}

		const { unmount } = render(
			<GlobalProvider initialState={emptyState} api={api}>
				<Probe />
			</GlobalProvider>,
		)

		unmount()
		resolveProjects?.()
		await Promise.resolve()
	})
})

function ProjectSetter() {
	const { state, actions } = useGlobal()

	return (
		<div>
			<span data-testid="project-count">{state.projects.length}</span>
			<button
				type="button"
				data-testid="clear-projects"
				onClick={() => actions.setProjects([])}
			>
				Clear
			</button>
		</div>
	)
}
