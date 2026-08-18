import { useEffect, useState } from 'react'
import type {
	Agent,
	Budget,
	HarnessApi,
	Permission,
	Rule,
} from '@/service/api/HarnessApi'
import * as styles from './ConfigurationDialog.module.scss'

interface ConfigurationDialogProps {
	api: HarnessApi
	onClose: () => void
}

type Tab = 'agents' | 'rules' | 'budgets' | 'permissions'
type Status = 'idle' | 'working' | 'success' | 'error'

export default function ConfigurationDialog({
	api,
	onClose,
}: ConfigurationDialogProps) {
	const [activeTab, setActiveTab] = useState<Tab>('agents')
	const [status, setStatus] = useState<Status>('idle')
	const [message, setMessage] = useState('')

	const [agents, setAgents] = useState<Agent[]>([])
	const [rules, setRules] = useState<Rule[]>([])
	const [budgets, setBudgets] = useState<Budget[]>([])
	const [permissions, setPermissions] = useState<Permission[]>([])

	const [agentForm, setAgentForm] = useState<Agent | null>(null)
	const [ruleForm, setRuleForm] = useState<Rule | null>(null)
	const [budgetForm, setBudgetForm] = useState<Budget | null>(null)
	const [permissionForm, setPermissionForm] = useState<Permission | null>(null)

	useEffect(() => {
		let active = true

		Promise.all([
			api.listAgents(),
			api.listRules(),
			api.listBudgets(),
			api.listPermissions(),
		])
			.then(([a, r, b, p]) => {
				if (!active) return
				setAgents(a)
				setRules(r)
				setBudgets(b)
				setPermissions(p)
			})
			.catch((error: unknown) => {
				if (!active) return
				setStatus('error')
				setMessage(error instanceof Error ? error.message : 'Failed to load')
			})

		return () => {
			active = false
		}
	}, [api])

	function resetForm() {
		setAgentForm(null)
		setRuleForm(null)
		setBudgetForm(null)
		setPermissionForm(null)
		setStatus('idle')
		setMessage('')
	}

	async function handleSaveAgent() {
		if (!agentForm) return
		setStatus('working')
		setMessage('')
		try {
			const saved = await api.createAgent(agentForm)
			setAgents((prev) => [...prev, saved])
			resetForm()
			setStatus('success')
			setMessage('Agent created.')
		} catch (error: unknown) {
			setStatus('error')
			setMessage(error instanceof Error ? error.message : 'Failed')
		}
	}

	async function handleSaveRule() {
		if (!ruleForm) return
		setStatus('working')
		setMessage('')
		try {
			const saved = await api.createRule(ruleForm)
			setRules((prev) => [...prev, saved])
			resetForm()
			setStatus('success')
			setMessage('Rule created.')
		} catch (error: unknown) {
			setStatus('error')
			setMessage(error instanceof Error ? error.message : 'Failed')
		}
	}

	async function handleSaveBudget() {
		if (!budgetForm) return
		setStatus('working')
		setMessage('')
		try {
			const saved = await api.createBudget(budgetForm)
			setBudgets((prev) => [...prev, saved])
			resetForm()
			setStatus('success')
			setMessage('Budget created.')
		} catch (error: unknown) {
			setStatus('error')
			setMessage(error instanceof Error ? error.message : 'Failed')
		}
	}

	async function handleSavePermission() {
		if (!permissionForm) return
		setStatus('working')
		setMessage('')
		try {
			const saved = await api.createPermission(permissionForm)
			setPermissions((prev) => [...prev, saved])
			resetForm()
			setStatus('success')
			setMessage('Permission created.')
		} catch (error: unknown) {
			setStatus('error')
			setMessage(error instanceof Error ? error.message : 'Failed')
		}
	}

	return (
		<div className={styles.overlay} data-testid="configuration-dialog">
			<div className={styles.panel}>
				<header className={styles.header}>
					<h2 className={styles.heading}>Configuration</h2>
					<button
						type="button"
						className={styles.button}
						data-testid="close-configuration"
						onClick={onClose}
					>
						Close
					</button>
				</header>

				<nav className={styles.tabs}>
					<button
						type="button"
						className={activeTab === 'agents' ? styles.active : styles.tab}
						data-testid="agents-tab"
						onClick={() => {
							setActiveTab('agents')
							resetForm()
						}}
					>
						Agents
					</button>
					<button
						type="button"
						className={activeTab === 'rules' ? styles.active : styles.tab}
						data-testid="rules-tab"
						onClick={() => {
							setActiveTab('rules')
							resetForm()
						}}
					>
						Rules
					</button>
					<button
						type="button"
						className={activeTab === 'budgets' ? styles.active : styles.tab}
						data-testid="budgets-tab"
						onClick={() => {
							setActiveTab('budgets')
							resetForm()
						}}
					>
						Budgets
					</button>
					<button
						type="button"
						className={activeTab === 'permissions' ? styles.active : styles.tab}
						data-testid="permissions-tab"
						onClick={() => {
							setActiveTab('permissions')
							resetForm()
						}}
					>
						Permissions
					</button>
				</nav>

				{status === 'success' ? (
					<p className={styles.status} data-testid="config-status">
						{message}
					</p>
				) : null}
				{status === 'error' ? (
					<p className={styles.error} data-testid="config-error">
						{message}
					</p>
				) : null}

				{activeTab === 'agents' ? (
					<section className={styles.section} data-testid="agents-section">
						{agents.length > 0 ? (
							<ul className={styles.list}>
								{agents.map((agent) => (
									<li key={agent.id} className={styles.listItem}>
										<span className={styles.itemName}>{agent.name}</span>
										<span className={styles.itemMeta}>{agent.role}</span>
									</li>
								))}
							</ul>
						) : (
							<p className={styles.empty}>No agents configured.</p>
						)}

						{agentForm ? (
							<div className={styles.form}>
								<label className={styles.label} htmlFor="agent-name">
									Name
								</label>
								<input
									className={styles.input}
									id="agent-name"
									data-testid="agent-name"
									value={agentForm.name}
									onChange={(e) =>
										setAgentForm({ ...agentForm, name: e.target.value })
									}
								/>
								<label className={styles.label} htmlFor="agent-role">
									Role
								</label>
								<input
									className={styles.input}
									id="agent-role"
									data-testid="agent-role"
									value={agentForm.role}
									onChange={(e) =>
										setAgentForm({ ...agentForm, role: e.target.value })
									}
								/>
								<label className={styles.label} htmlFor="agent-description">
									Description
								</label>
								<input
									className={styles.input}
									id="agent-description"
									data-testid="agent-description"
									value={agentForm.description}
									onChange={(e) =>
										setAgentForm({
											...agentForm,
											description: e.target.value,
										})
									}
								/>
								<div className={styles.row}>
									<button
										type="button"
										className={styles.button}
										data-testid="save-agent"
										disabled={status === 'working'}
										onClick={() => void handleSaveAgent()}
									>
										Save
									</button>
									<button
										type="button"
										className={styles.button}
										onClick={resetForm}
									>
										Cancel
									</button>
								</div>
							</div>
						) : (
							<button
								type="button"
								className={styles.button}
								data-testid="new-agent"
								onClick={() =>
									setAgentForm({
										id: crypto.randomUUID(),
										name: '',
										role: '',
										description: '',
										tools: [],
										mcpAccess: [],
										memoryAccess: false,
										sandboxPolicy: {
											level: 'workspace-write',
											workspaceRoot: '.',
										},
										budget: {
											id: crypto.randomUUID(),
											name: 'default',
											tokenLimitPerTurn: null,
											tokenLimitPerSession: null,
											costLimitPerTurn: null,
											costLimitPerSession: null,
											enforcementPoint: 'pre_request',
										},
										modelPreferences: {
											provider: 'openai',
											model: 'gpt-4o-mini',
										},
									})
								}
							>
								New Agent
							</button>
						)}
					</section>
				) : null}

				{activeTab === 'rules' ? (
					<section className={styles.section} data-testid="rules-section">
						{rules.length > 0 ? (
							<ul className={styles.list}>
								{rules.map((rule) => (
									<li key={rule.id} className={styles.listItem}>
										<span className={styles.itemName}>{rule.name}</span>
										<span className={styles.itemMeta}>
											{rule.when} → {rule.action}
										</span>
									</li>
								))}
							</ul>
						) : (
							<p className={styles.empty}>No rules configured.</p>
						)}

						{ruleForm ? (
							<div className={styles.form}>
								<label className={styles.label} htmlFor="rule-name">
									Name
								</label>
								<input
									className={styles.input}
									id="rule-name"
									data-testid="rule-name"
									value={ruleForm.name}
									onChange={(e) =>
										setRuleForm({ ...ruleForm, name: e.target.value })
									}
								/>
								<label className={styles.label} htmlFor="rule-when">
									Trigger
								</label>
								<select
									className={styles.input}
									id="rule-when"
									data-testid="rule-when"
									value={ruleForm.when}
									onChange={(e) =>
										setRuleForm({
											...ruleForm,
											when: e.target.value as Rule['when'],
										})
									}
								>
									<option value="tool_call">tool_call</option>
									<option value="turn_start">turn_start</option>
									<option value="turn_end">turn_end</option>
									<option value="step_start">step_start</option>
									<option value="step_end">step_end</option>
									<option value="session_start">session_start</option>
									<option value="session_end">session_end</option>
								</select>
								<label className={styles.label} htmlFor="rule-action">
									Action
								</label>
								<select
									className={styles.input}
									id="rule-action"
									data-testid="rule-action"
									value={ruleForm.action}
									onChange={(e) =>
										setRuleForm({
											...ruleForm,
											action: e.target.value as Rule['action'],
										})
									}
								>
									<option value="allow">allow</option>
									<option value="deny">deny</option>
									<option value="require_approval">require_approval</option>
									<option value="annotate">annotate</option>
								</select>
								<div className={styles.row}>
									<button
										type="button"
										className={styles.button}
										data-testid="save-rule"
										disabled={status === 'working'}
										onClick={() => void handleSaveRule()}
									>
										Save
									</button>
									<button
										type="button"
										className={styles.button}
										onClick={resetForm}
									>
										Cancel
									</button>
								</div>
							</div>
						) : (
							<button
								type="button"
								className={styles.button}
								data-testid="new-rule"
								onClick={() =>
									setRuleForm({
										id: crypto.randomUUID(),
										name: '',
										when: 'tool_call',
										condition: {},
										action: 'deny',
										guard: null,
									})
								}
							>
								New Rule
							</button>
						)}
					</section>
				) : null}

				{activeTab === 'budgets' ? (
					<section className={styles.section} data-testid="budgets-section">
						{budgets.length > 0 ? (
							<ul className={styles.list}>
								{budgets.map((budget) => (
									<li key={budget.id} className={styles.listItem}>
										<span className={styles.itemName}>{budget.name}</span>
										<span className={styles.itemMeta}>
											{budget.tokenLimitPerTurn
												? `${budget.tokenLimitPerTurn} tokens/turn`
												: 'unlimited'}
										</span>
									</li>
								))}
							</ul>
						) : (
							<p className={styles.empty}>No budgets configured.</p>
						)}

						{budgetForm ? (
							<div className={styles.form}>
								<label className={styles.label} htmlFor="budget-name">
									Name
								</label>
								<input
									className={styles.input}
									id="budget-name"
									data-testid="budget-name"
									value={budgetForm.name}
									onChange={(e) =>
										setBudgetForm({
											...budgetForm,
											name: e.target.value,
										})
									}
								/>
								<label
									className={styles.label}
									htmlFor="budget-token-limit-turn"
								>
									Token limit per turn
								</label>
								<input
									className={styles.input}
									id="budget-token-limit-turn"
									data-testid="budget-token-limit-turn"
									type="number"
									value={budgetForm.tokenLimitPerTurn?.toString() ?? ''}
									onChange={(e) =>
										setBudgetForm({
											...budgetForm,
											tokenLimitPerTurn: e.target.value
												? Number(e.target.value)
												: null,
										})
									}
								/>
								<label
									className={styles.label}
									htmlFor="budget-token-limit-session"
								>
									Token limit per session
								</label>
								<input
									className={styles.input}
									id="budget-token-limit-session"
									data-testid="budget-token-limit-session"
									type="number"
									value={budgetForm.tokenLimitPerSession?.toString() ?? ''}
									onChange={(e) =>
										setBudgetForm({
											...budgetForm,
											tokenLimitPerSession: e.target.value
												? Number(e.target.value)
												: null,
										})
									}
								/>
								<div className={styles.row}>
									<button
										type="button"
										className={styles.button}
										data-testid="save-budget"
										disabled={status === 'working'}
										onClick={() => void handleSaveBudget()}
									>
										Save
									</button>
									<button
										type="button"
										className={styles.button}
										onClick={resetForm}
									>
										Cancel
									</button>
								</div>
							</div>
						) : (
							<button
								type="button"
								className={styles.button}
								data-testid="new-budget"
								onClick={() =>
									setBudgetForm({
										id: crypto.randomUUID(),
										name: '',
										tokenLimitPerTurn: null,
										tokenLimitPerSession: null,
										costLimitPerTurn: null,
										costLimitPerSession: null,
										enforcementPoint: 'pre_request',
									})
								}
							>
								New Budget
							</button>
						)}
					</section>
				) : null}

				{activeTab === 'permissions' ? (
					<section className={styles.section} data-testid="permissions-section">
						{permissions.length > 0 ? (
							<ul className={styles.list}>
								{permissions.map((permission) => (
									<li key={permission.id} className={styles.listItem}>
										<span className={styles.itemName}>{permission.name}</span>
										<span className={styles.itemMeta}>
											{permission.resource}:{permission.resourceId} →{' '}
											{permission.action}
										</span>
									</li>
								))}
							</ul>
						) : (
							<p className={styles.empty}>No permissions configured.</p>
						)}

						{permissionForm ? (
							<div className={styles.form}>
								<label className={styles.label} htmlFor="permission-name">
									Name
								</label>
								<input
									className={styles.input}
									id="permission-name"
									data-testid="permission-name"
									value={permissionForm.name}
									onChange={(e) =>
										setPermissionForm({
											...permissionForm,
											name: e.target.value,
										})
									}
								/>
								<label className={styles.label} htmlFor="permission-resource">
									Resource
								</label>
								<select
									className={styles.input}
									id="permission-resource"
									data-testid="permission-resource"
									value={permissionForm.resource}
									onChange={(e) =>
										setPermissionForm({
											...permissionForm,
											resource: e.target.value as Permission['resource'],
										})
									}
								>
									<option value="tool">tool</option>
									<option value="sandbox">sandbox</option>
									<option value="mcp_server">mcp_server</option>
								</select>
								<label
									className={styles.label}
									htmlFor="permission-resource-id"
								>
									Resource ID
								</label>
								<input
									className={styles.input}
									id="permission-resource-id"
									data-testid="permission-resource-id"
									value={permissionForm.resourceId}
									onChange={(e) =>
										setPermissionForm({
											...permissionForm,
											resourceId: e.target.value,
										})
									}
								/>
								<label className={styles.label} htmlFor="permission-action">
									Action
								</label>
								<select
									className={styles.input}
									id="permission-action"
									data-testid="permission-action"
									value={permissionForm.action}
									onChange={(e) =>
										setPermissionForm({
											...permissionForm,
											action: e.target.value as Permission['action'],
										})
									}
								>
									<option value="allow">allow</option>
									<option value="deny">deny</option>
									<option value="require_approval">require_approval</option>
								</select>
								<label className={styles.label} htmlFor="permission-scope">
									Scope
								</label>
								<select
									className={styles.input}
									id="permission-scope"
									data-testid="permission-scope"
									value={permissionForm.scope}
									onChange={(e) =>
										setPermissionForm({
											...permissionForm,
											scope: e.target.value as Permission['scope'],
										})
									}
								>
									<option value="project">project</option>
									<option value="agent">agent</option>
									<option value="session">session</option>
								</select>
								<div className={styles.row}>
									<button
										type="button"
										className={styles.button}
										data-testid="save-permission"
										disabled={status === 'working'}
										onClick={() => void handleSavePermission()}
									>
										Save
									</button>
									<button
										type="button"
										className={styles.button}
										onClick={resetForm}
									>
										Cancel
									</button>
								</div>
							</div>
						) : (
							<button
								type="button"
								className={styles.button}
								data-testid="new-permission"
								onClick={() =>
									setPermissionForm({
										id: crypto.randomUUID(),
										name: '',
										resource: 'tool',
										resourceId: '',
										action: 'deny',
										scope: 'project',
										scopeId: null,
									})
								}
							>
								New Permission
							</button>
						)}
					</section>
				) : null}
			</div>
		</div>
	)
}
