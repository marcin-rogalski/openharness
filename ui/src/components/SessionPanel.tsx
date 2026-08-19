import { useGlobal } from '@/service/GlobalService'
import * as styles from './SessionPanel.module.scss'

export default function SessionPanel() {
	const { state, actions } = useGlobal()

	if (!state.selectedProjectId || state.sessions.length === 0) {
		return null
	}

	return (
		<section className={styles.panel} data-testid="session-panel">
			<h2 className={styles.heading}>Sessions</h2>
			<ul className={styles.list}>
				{state.sessions.map((session) => (
					<li key={session.id} className={styles.item}>
						<span className={styles.status} data-testid="session-status">
							{session.status}
						</span>
						<span className={styles.date} data-testid="session-date">
							{new Date(session.createdAt).toLocaleString()}
						</span>
						<span className={styles.events} data-testid="session-events">
							{session.eventCount} events
						</span>
						{state.sessionId !== session.id ? (
							<button
								type="button"
								className={styles.button}
								data-testid="select-session"
								onClick={() => actions.selectSession(session.id)}
							>
								Open
							</button>
						) : (
							<span className={styles.active} data-testid="session-active">
								Active
							</span>
						)}
					</li>
				))}
			</ul>
		</section>
	)
}
