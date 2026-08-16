import { useEffect, useState } from 'react'
import type { HarnessApi, HarnessConfig } from '@/service/api/HarnessApi'
import { createHarnessApiClient } from '@/service/api/HarnessApiClient'
import type { UiConfig } from '@/service/config/UiConfig'
import * as styles from './SettingsDialog.module.scss'

interface SettingsDialogProps {
	api: HarnessApi
	uiConfig: UiConfig | null
	onUiConfigChange?: (config: UiConfig) => void
	onClose: () => void
	apiFactory?: (baseUrl: string) => HarnessApi
}

type Tab = 'connection' | 'server'
type Status = 'idle' | 'working' | 'success' | 'error'

export default function SettingsDialog({
	api,
	uiConfig,
	onUiConfigChange,
	onClose,
	apiFactory = createHarnessApiClient,
}: SettingsDialogProps) {
	const [activeTab, setActiveTab] = useState<Tab>('connection')
	const [baseUrl, setBaseUrl] = useState(uiConfig?.harnessBaseUrl ?? '')
	const [connectionStatus, setConnectionStatus] = useState<Status>('idle')
	const [connectionMessage, setConnectionMessage] = useState('')
	const [serverConfig, setServerConfig] = useState<HarnessConfig | null>(null)
	const [port, setPort] = useState('')
	const [projectsDir, setProjectsDir] = useState('')
	const [serverStatus, setServerStatus] = useState<Status>('idle')
	const [serverMessage, setServerMessage] = useState('')
	const [restartRequired, setRestartRequired] = useState(false)

	useEffect(() => {
		let active = true

		api
			.getConfig()
			.then((config) => {
				if (!active) {
					return
				}
				setServerConfig(config)
				setPort(String(config.port))
				setProjectsDir(config.projectsDir)
			})
			.catch((error: unknown) => {
				if (!active) {
					return
				}
				setServerStatus('error')
				setServerMessage(
					error instanceof Error
						? error.message
						: 'Failed to load server config',
				)
			})

		return () => {
			active = false
		}
	}, [api])

	async function handleTestConnection() {
		setConnectionStatus('working')
		setConnectionMessage('')

		try {
			await apiFactory(baseUrl).health()
			setConnectionStatus('success')
			setConnectionMessage('Connection successful')
		} catch (error: unknown) {
			setConnectionStatus('error')
			setConnectionMessage(
				error instanceof Error ? error.message : 'Connection failed',
			)
		}
	}

	function handleSaveConnection() {
		if (!onUiConfigChange) {
			return
		}
		onUiConfigChange({ schemaVersion: 1, harnessBaseUrl: baseUrl })
	}

	async function handleSaveServer() {
		const parsedPort = Number(port)
		if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
			setServerStatus('error')
			setServerMessage('Port must be an integer between 1 and 65535')
			return
		}

		const trimmedProjectsDir = projectsDir.trim()
		if (!trimmedProjectsDir) {
			setServerStatus('error')
			setServerMessage('Projects directory must not be empty')
			return
		}

		setServerStatus('working')
		setServerMessage('')
		setRestartRequired(false)

		try {
			const result = await api.updateConfig({
				port: parsedPort,
				projectsDir: trimmedProjectsDir,
			})
			setServerConfig(result.config)
			setPort(String(result.config.port))
			setProjectsDir(result.config.projectsDir)
			setRestartRequired(result.restartRequired)
			setServerStatus('success')
			setServerMessage(
				result.restartRequired
					? 'Saved. Restart the harness to apply the new port.'
					: 'Saved.',
			)
		} catch (error: unknown) {
			setServerStatus('error')
			setServerMessage(
				error instanceof Error ? error.message : 'Failed to save config',
			)
		}
	}

	return (
		<div className={styles.overlay} data-testid="settings-dialog">
			<div className={styles.panel}>
				<header className={styles.header}>
					<h2 className={styles.heading}>Settings</h2>
					<button
						type="button"
						className={styles.button}
						data-testid="close-settings"
						onClick={onClose}
					>
						Close
					</button>
				</header>

				<nav className={styles.tabs}>
					<button
						type="button"
						className={activeTab === 'connection' ? styles.active : styles.tab}
						data-testid="connection-tab"
						onClick={() => setActiveTab('connection')}
					>
						Connection
					</button>
					<button
						type="button"
						className={activeTab === 'server' ? styles.active : styles.tab}
						data-testid="server-tab"
						onClick={() => setActiveTab('server')}
					>
						Server
					</button>
				</nav>

				{activeTab === 'connection' ? (
					<section className={styles.section} data-testid="connection-settings">
						<label className={styles.label} htmlFor="settings-base-url">
							Harness base URL
						</label>
						<input
							id="settings-base-url"
							className={styles.input}
							data-testid="settings-base-url"
							value={baseUrl}
							onChange={(event) => setBaseUrl(event.target.value)}
						/>
						<div className={styles.row}>
							<button
								type="button"
								className={styles.button}
								data-testid="test-connection-settings"
								disabled={connectionStatus === 'working'}
								onClick={() => void handleTestConnection()}
							>
								Test
							</button>
							<button
								type="button"
								className={styles.button}
								data-testid="save-connection-settings"
								onClick={handleSaveConnection}
							>
								Save
							</button>
						</div>
						{connectionStatus === 'working' ? (
							<p className={styles.status} data-testid="connection-status">
								Testing connection...
							</p>
						) : null}
						{connectionStatus === 'success' ? (
							<p className={styles.status} data-testid="connection-status">
								{connectionMessage}
							</p>
						) : null}
						{connectionStatus === 'error' ? (
							<p className={styles.error} data-testid="connection-error">
								{connectionMessage}
							</p>
						) : null}
					</section>
				) : null}

				{activeTab === 'server' ? (
					<section className={styles.section} data-testid="server-settings">
						<label className={styles.label} htmlFor="settings-port">
							Port
						</label>
						<input
							id="settings-port"
							className={styles.input}
							data-testid="settings-port"
							value={port}
							onChange={(event) => setPort(event.target.value)}
						/>
						<label className={styles.label} htmlFor="settings-projects-dir">
							Projects directory
						</label>
						<input
							id="settings-projects-dir"
							className={styles.input}
							data-testid="settings-projects-dir"
							value={projectsDir}
							onChange={(event) => setProjectsDir(event.target.value)}
						/>
						<button
							type="button"
							className={styles.button}
							data-testid="save-server-settings"
							disabled={serverStatus === 'working' || !serverConfig}
							onClick={() => void handleSaveServer()}
						>
							Save
						</button>
						{serverStatus === 'working' ? (
							<p className={styles.status} data-testid="server-status">
								Saving...
							</p>
						) : null}
						{serverStatus === 'success' ? (
							<p className={styles.status} data-testid="server-status">
								{serverMessage}
							</p>
						) : null}
						{serverStatus === 'error' ? (
							<p className={styles.error} data-testid="server-error">
								{serverMessage}
							</p>
						) : null}
						{restartRequired ? (
							<p className={styles.status} data-testid="restart-warning">
								Restart the harness after saving a new port.
							</p>
						) : null}
					</section>
				) : null}
			</div>
		</div>
	)
}
