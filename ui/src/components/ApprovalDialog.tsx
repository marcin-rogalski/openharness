import { useState } from 'react'
import { useGlobal } from '@/service/GlobalService'
import * as styles from './ApprovalDialog.module.scss'

export default function ApprovalDialog() {
	const { state, actions } = useGlobal()
	const [working, setWorking] = useState(false)

	if (!state.pendingApproval) {
		return null
	}

	const { toolCallId, tool, input } = state.pendingApproval

	async function handleApprove() {
		setWorking(true)
		await actions.approveToolCall(toolCallId)
		setWorking(false)
	}

	async function handleDeny() {
		setWorking(true)
		await actions.denyToolCall(toolCallId)
		setWorking(false)
	}

	return (
		<div className={styles.overlay} data-testid="approval-dialog">
			<div className={styles.panel}>
				<h2 className={styles.heading}>Tool Approval Required</h2>
				<p className={styles.toolName} data-testid="approval-tool">
					{tool}
				</p>
				<pre className={styles.input} data-testid="approval-input">
					{input}
				</pre>
				<div className={styles.row}>
					<button
						type="button"
						className={styles.approve}
						data-testid="approve-button"
						disabled={working}
						onClick={() => void handleApprove()}
					>
						Approve
					</button>
					<button
						type="button"
						className={styles.deny}
						data-testid="deny-button"
						disabled={working}
						onClick={() => void handleDeny()}
					>
						Deny
					</button>
				</div>
			</div>
		</div>
	)
}
