import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { createMockHarnessApi } from '@/service/api/MockHarnessApi'
import { GlobalProvider } from '@/service/GlobalService'
import { mockState } from '@/service/mock'
import type { GlobalState } from '@/service/schema'
import MessagePanel from './MessagePanel'

function renderPanel(initialState: GlobalState = mockState) {
	render(
		<GlobalProvider initialState={initialState} api={createMockHarnessApi()}>
			<MessagePanel />
		</GlobalProvider>,
	)
}

describe('MessagePanel', () => {
	it('asks for a project when none is selected', () => {
		renderPanel()

		expect(
			screen.getByText('Select a project to start a conversation'),
		).toBeInTheDocument()
		expect(screen.queryByTestId('message-input')).not.toBeInTheDocument()
	})

	it('sends a message and shows the mocked agent timeline', async () => {
		const user = userEvent.setup()
		renderPanel({ ...mockState, selectedProjectId: 'project-1' })

		expect(screen.getByTestId('send-message')).toBeDisabled()

		await user.type(screen.getByTestId('message-input'), 'Hello')
		await user.click(screen.getByTestId('send-message'))

		expect(screen.getByTestId('message-input')).toHaveValue('')
		expect(await screen.findByTestId('timeline-user')).toHaveTextContent(
			'Hello',
		)
		expect(screen.getByTestId('timeline-thinking')).toHaveTextContent(
			'Thinking about: Hello',
		)
		expect(screen.getAllByTestId('timeline-tool-call')).toHaveLength(2)
		expect(screen.getByTestId('timeline-response')).toHaveTextContent(
			'Mock response to: Hello',
		)
	})

	it('ignores an empty submission', () => {
		renderPanel({ ...mockState, selectedProjectId: 'project-1' })

		fireEvent.submit(screen.getByTestId('composer-form'))

		expect(screen.getByText('No messages yet')).toBeInTheDocument()
	})
})
