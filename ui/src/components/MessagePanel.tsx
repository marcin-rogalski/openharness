import { useState } from 'react'
import { useGlobal } from '@/service/GlobalService'
import type { TimelineEntry } from '@/service/schema'
import * as styles from './MessagePanel.module.scss'

export default function MessagePanel() {
	const { state, actions } = useGlobal()
	const [draft, setDraft] = useState('')
	const selectedProject = state.projects.find(
		(project) => project.id === state.selectedProjectId,
	)
	const entries = state.timeline.filter(
		(entry) => entry.projectId === state.selectedProjectId,
	)

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()
		if (!draft.trim()) {
			return
		}

		actions.sendMessage(draft)
		setDraft('')
	}

	if (!selectedProject) {
		return (
			<section className={styles.panel} data-testid="message-panel">
				<p className={styles.empty}>Select a project to start a conversation</p>
			</section>
		)
	}

	return (
		<section className={styles.panel} data-testid="message-panel">
			<h2 className={styles.heading}>Conversation</h2>

			{entries.length === 0 ? (
				<p className={styles.empty}>No messages yet</p>
			) : (
				<ol className={styles.timeline}>
					{entries.map((entry) => (
						<li key={entry.id} className={styles.entry}>
							<TimelineEntryView entry={entry} />
						</li>
					))}
				</ol>
			)}

			<form
				className={styles.composer}
				data-testid="composer-form"
				onSubmit={handleSubmit}
			>
				<label className={styles.label} htmlFor="message-input">
					Message
				</label>
				<input
					id="message-input"
					className={styles.input}
					data-testid="message-input"
					value={draft}
					placeholder="Ask the orchestrator"
					onChange={(event) => setDraft(event.target.value)}
				/>
				<button
					type="submit"
					className={styles.button}
					data-testid="send-message"
					disabled={!draft.trim()}
				>
					Send
				</button>
				{state.sessionId ? (
					<button
						type="button"
						className={styles.button}
						data-testid="stop-session"
						onClick={() => void actions.stopSession()}
					>
						Stop
					</button>
				) : null}
			</form>
		</section>
	)
}

function TimelineEntryView({ entry }: { entry: TimelineEntry }) {
	switch (entry.type) {
		case 'user_message':
			return (
				<span className={styles.user} data-testid="timeline-user">
					{entry.content}
				</span>
			)
		case 'agent_thinking':
			return (
				<span className={styles.thinking} data-testid="timeline-thinking">
					Thinking: {entry.text}
				</span>
			)
		case 'agent_tool_call':
			return (
				<span className={styles.toolCall} data-testid="timeline-tool-call">
					Tool {entry.tool} {entry.status}
					{entry.input ? ` input=${entry.input}` : ''}
					{entry.output ? ` output=${entry.output}` : ''}
				</span>
			)
		case 'agent_response':
			return (
				<span className={styles.response} data-testid="timeline-response">
					{entry.text}
				</span>
			)
	}
}
