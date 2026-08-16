import { useState } from 'react'
import type { HarnessApi } from '@/service/api/HarnessApi'
import { createHarnessApiClient } from '@/service/api/HarnessApiClient'
import { DEFAULT_HARNESS_BASE_URL } from '@/service/config/UiConfig'
import * as styles from './ConnectionPrompt.module.scss'

interface ConnectionPromptProps {
	onConnect: (harnessBaseUrl: string) => void
	apiFactory?: (baseUrl: string) => HarnessApi
}

type Status = 'idle' | 'testing' | 'success' | 'error'

export default function ConnectionPrompt({
	onConnect,
	apiFactory = createHarnessApiClient,
}: ConnectionPromptProps) {
	const [harnessBaseUrl, setHarnessBaseUrl] = useState(DEFAULT_HARNESS_BASE_URL)
	const [status, setStatus] = useState<Status>('idle')
	const [message, setMessage] = useState('')

	async function handleTest() {
		setStatus('testing')
		setMessage('')

		try {
			await apiFactory(harnessBaseUrl).health()
			setStatus('success')
			setMessage('Connection successful')
			onConnect(harnessBaseUrl)
		} catch (error: unknown) {
			setStatus('error')
			setMessage(error instanceof Error ? error.message : 'Connection failed')
		}
	}

	return (
		<main className={styles.panel} data-testid="connection-prompt">
			<h1 className={styles.heading}>Connect to OpenHarness</h1>
			<p className={styles.description}>
				Enter the harness base URL. Leave it empty to use the same-origin /api
				proxy.
			</p>

			<form
				className={styles.form}
				data-testid="connection-form"
				onSubmit={(event) => {
					event.preventDefault()
					void handleTest()
				}}
			>
				<label className={styles.label} htmlFor="harness-base-url">
					Harness base URL
				</label>
				<input
					id="harness-base-url"
					className={styles.input}
					data-testid="harness-base-url"
					value={harnessBaseUrl}
					onChange={(event) => setHarnessBaseUrl(event.target.value)}
				/>
				<button
					type="submit"
					className={styles.button}
					data-testid="test-connection"
					disabled={status === 'testing'}
				>
					Test and connect
				</button>
			</form>

			{status === 'testing' ? (
				<p className={styles.status} data-testid="connection-status">
					Testing connection...
				</p>
			) : null}
			{status === 'success' ? (
				<p className={styles.status} data-testid="connection-status">
					{message}
				</p>
			) : null}
			{status === 'error' ? (
				<p className={styles.error} data-testid="connection-error">
					{message}
				</p>
			) : null}
		</main>
	)
}
