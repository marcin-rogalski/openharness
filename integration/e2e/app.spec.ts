import { expect, test } from '@playwright/test'

test('loads projects and sends a message through the harness API', async ({
	page,
}) => {
	await page.goto('/')

	await expect(page.getByRole('heading', { name: 'OpenHarness' })).toBeVisible()
	await expect(page.getByTestId('project-name').first()).toHaveText(
		'OpenHarness',
	)

	await page.getByTestId('select-project').first().click()
	await expect(page.getByTestId('selected-project')).toHaveText(
		'Selected: OpenHarness',
	)

	await page.getByTestId('message-input').fill('Hello from Playwright')
	await page.getByTestId('send-message').click()

	await expect(page.getByTestId('timeline-user')).toHaveText(
		'Hello from Playwright',
	)
	await expect(page.getByTestId('timeline-response')).toHaveText(
		'Mock response to: Hello from Playwright',
	)
})
