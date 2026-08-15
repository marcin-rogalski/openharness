import MessagePanel from '@/components/MessagePanel'
import { useGlobal } from '@/service/GlobalService'
import * as styles from './App.module.scss'

export default function App() {
	const { state, actions } = useGlobal()
	const selectedProject = state.projects.find(
		(project) => project.id === state.selectedProjectId,
	)

	return (
		<main className={styles.app}>
			<h1 className={styles.title}>OpenHarness</h1>
			<p className={styles.description}>Projects</p>

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

			<MessagePanel />
		</main>
	)
}
