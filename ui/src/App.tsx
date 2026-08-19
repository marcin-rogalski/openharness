import { useState } from 'react'
import ApprovalDialog from '@/components/ApprovalDialog'
import ConfigurationDialog from '@/components/ConfigurationDialog'
import MessagePanel from '@/components/MessagePanel'
import SessionPanel from '@/components/SessionPanel'
import SettingsDialog from '@/components/SettingsDialog'
import type { HarnessApi } from '@/service/api/HarnessApi'
import type { UiConfig } from '@/service/config/UiConfig'
import { useGlobal } from '@/service/GlobalService'
import * as styles from './App.module.scss'

interface AppProps {
	api?: HarnessApi
	uiConfig?: UiConfig | null
	onUiConfigChange?: (config: UiConfig) => void
}

export default function App({
	api,
	uiConfig,
	onUiConfigChange,
}: AppProps = {}) {
	const { state, actions } = useGlobal()
	const [settingsOpen, setSettingsOpen] = useState(false)
	const [configOpen, setConfigOpen] = useState(false)
	const selectedProject = state.projects.find(
		(project) => project.id === state.selectedProjectId,
	)

	return (
		<main className={styles.app}>
			<header className={styles.header}>
				<h1 className={styles.title}>OpenHarness</h1>
				{api ? (
					<div className={styles.headerActions}>
						<button
							type="button"
							className={styles.button}
							data-testid="open-configuration"
							onClick={() => setConfigOpen(true)}
						>
							Configure
						</button>
						<button
							type="button"
							className={styles.button}
							data-testid="open-settings"
							onClick={() => setSettingsOpen(true)}
						>
							Settings
						</button>
					</div>
				) : null}
			</header>
			<p className={styles.description}>Projects</p>

			{state.error ? (
				<p className={styles.error} data-testid="error-banner">
					{state.error}
				</p>
			) : null}

			{state.projects.length === 0 ? (
				<p className={styles.empty}>No projects</p>
			) : (
				<ul className={styles.list}>
					{state.projects.map((project) => (
						<li key={project.id} className={styles.item}>
							<span className={styles.projectName} data-testid="project-name">
								{project.name}
							</span>
							<span
								className={styles.projectStatus}
								data-testid="project-status"
							>
								{project.status}
							</span>
							<button
								type="button"
								className={styles.button}
								data-testid="select-project"
								onClick={() => actions.selectProject(project.id)}
							>
								Select
							</button>
						</li>
					))}
				</ul>
			)}

			<p className={styles.selected} data-testid="selected-project">
				{selectedProject
					? `Selected: ${selectedProject.name}`
					: 'No project selected'}
			</p>

			<SessionPanel />

			<MessagePanel />

			{api ? <ApprovalDialog /> : null}

			{settingsOpen && api ? (
				<SettingsDialog
					api={api}
					uiConfig={uiConfig ?? null}
					onUiConfigChange={onUiConfigChange}
					onClose={() => setSettingsOpen(false)}
				/>
			) : null}

			{configOpen && api ? (
				<ConfigurationDialog api={api} onClose={() => setConfigOpen(false)} />
			) : null}
		</main>
	)
}
