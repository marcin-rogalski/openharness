import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { GlobalProvider, useGlobal } from './GlobalService'
import { mockState } from './mock'

function Probe() {
	const { state, actions } = useGlobal()

	return (
		<div>
			<span data-testid="project-count">{state.projects.length}</span>
			<span data-testid="selected-project">
				{state.selectedProjectId ?? 'none'}
			</span>
			<span data-testid="timeline-count">{state.timeline.length}</span>
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
				onClick={() => actions.sendMessage('Hello')}
			>
				Send
			</button>
		</div>
	)
}

describe('GlobalService', () => {
	it('exposes validated global state and actions', async () => {
		const user = userEvent.setup()
		render(
			<GlobalProvider initialState={mockState}>
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
			<GlobalProvider initialState={mockState}>
				<ProjectSetter />
			</GlobalProvider>,
		)

		await user.click(screen.getByTestId('clear-projects'))

		expect(screen.getByTestId('project-count')).toHaveTextContent('0')
	})

	it('appends a user message and mocked agent entries when a project is selected', async () => {
		const user = userEvent.setup()
		render(
			<GlobalProvider initialState={mockState}>
				<Probe />
			</GlobalProvider>,
		)

		await user.click(screen.getByTestId('select-project'))
		await user.click(screen.getByTestId('send-message'))

		expect(screen.getByTestId('timeline-count')).toHaveTextContent('5')
	})

	it('ignores messages when no project is selected', async () => {
		const user = userEvent.setup()
		render(
			<GlobalProvider initialState={mockState}>
				<Probe />
			</GlobalProvider>,
		)

		await user.click(screen.getByTestId('send-message'))

		expect(screen.getByTestId('timeline-count')).toHaveTextContent('0')
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
