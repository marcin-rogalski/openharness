import { useState } from 'react'
import { useGlobal } from '@/service/GlobalService'
import * as styles from './CreateProjectForm.module.scss'

export default function CreateProjectForm() {
	const { actions } = useGlobal()
	const [name, setName] = useState('')
	const [submitting, setSubmitting] = useState(false)

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault()
		const trimmed = name.trim()
		if (!trimmed || submitting) return
		setSubmitting(true)
		try {
			await actions.createProject(trimmed)
			setName('')
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<form
			className={styles.form}
			data-testid="create-project-form"
			onSubmit={handleSubmit}
		>
			<label className={styles.label} htmlFor="project-name">
				Project name
			</label>
			<input
				id="project-name"
				className={styles.input}
				data-testid="project-name-input"
				value={name}
				onChange={(event) => setName(event.target.value)}
				placeholder="My project"
			/>
			<button
				type="submit"
				className={styles.button}
				data-testid="create-project-button"
				disabled={submitting || !name.trim()}
			>
				{submitting ? 'Creating…' : 'Create project'}
			</button>
		</form>
	)
}
