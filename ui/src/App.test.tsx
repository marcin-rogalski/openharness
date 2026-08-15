import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '@/App'
import { GlobalProvider } from '@/service/GlobalService'
import { mockState } from '@/service/mock'
import type { GlobalState } from '@/service/schema'

function renderApp(initialState: GlobalState = mockState) {
	return render(
		<GlobalProvider initialState={initialState}>
			<App />
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
		renderApp({ projects: [], selectedProjectId: null, timeline: [] })

		expect(screen.getByText('No projects')).toBeInTheDocument()
		expect(screen.queryByTestId('select-project')).not.toBeInTheDocument()
	})
})
