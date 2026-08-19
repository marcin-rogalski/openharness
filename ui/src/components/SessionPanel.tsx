import { useGlobal } from '@/service/GlobalService'
import * as styles from './SessionPanel.module.scss'

function formatDuration(start: string, end: string | null): string {
	const startMs = new Date(start).getTime()
	const endMs = end ? new Date(end).getTime() : Date.now()
	const diffMs = endMs - startMs
	const minutes = Math.floor(diffMs / 60_000)
	if (minutes < 1) return '<1m'
	if (minutes < 60) return `${minutes}m`
	const hours = Math.floor(minutes / 60)
	return `${hours}h ${minutes % 60}m`
}

export default function SessionPanel() {
	const { state, actions } = useGlobal()

	if (!state.selectedProjectId || state.sessions.length === 0) {
		return null
	}

	return (
		<section className={styles.panel} data-testid="session-panel">
			<div className={styles.header}>
				<h2 className={styles.heading}>Sessions</h2>
				<button
					type="button"
					className={styles.newButton}
					data-testid="new-session-button"
					onClick={() => void actions.createSession()}
				>
					New Session
				</button>
			</div>
			<ul className={styles.list}>
				{state.sessions.map((session) => (
					<li key={session.id} className={styles.item}>
						<span className={styles.status} data-testid="session-status">
							{session.status}
						</span>
						<span className={styles.date} data-testid="session-date">
							{new Date(session.createdAt).toLocaleString()}
						</span>
						<span className={styles.duration} data-testid="session-duration">
							{formatDuration(session.createdAt, session.endedAt)}
						</span>
						<span className={styles.events} data-testid="session-events">
							{session.eventCount} events
						</span>
						{session.lastEventAt ? (
							<span
								className={styles.lastActivity}
								data-testid="session-last-activity"
							>
								{new Date(session.lastEventAt).toLocaleTimeString()}
							</span>
						) : null}
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
