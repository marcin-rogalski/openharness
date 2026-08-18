import { describe, expect, it } from 'vitest'
import { globalReducer } from './reducer'
import type { GlobalAction, GlobalState } from './schema'

const baseState: GlobalState = {
	projects: [
		{ id: 'project-1', name: 'OpenHarness', status: 'running' },
		{ id: 'project-2', name: 'Tempo', status: 'idle' },
	],
	selectedProjectId: 'project-1',
	sessionId: null,
	timeline: [],
	error: null,
	pendingApproval: null,
}

describe('globalReducer', () => {
	it('replaces projects and keeps a still-valid selection', () => {
		const state: GlobalState = {
			...baseState,
			selectedProjectId: 'project-2',
		}

		const next = globalReducer(state, {
			type: 'projects/set',
			projects: [{ id: 'project-2', name: 'Tempo', status: 'idle' }],
		})

		expect(next.projects).toHaveLength(1)
		expect(next.selectedProjectId).toBe('project-2')
	})

	it('clears the selection when the selected project is removed', () => {
		const next = globalReducer(baseState, {
			type: 'projects/set',
			projects: [{ id: 'project-3', name: 'Other', status: 'failed' }],
		})

		expect(next.selectedProjectId).toBeNull()
	})

	it('selects a project', () => {
		const next = globalReducer(baseState, {
			type: 'project/select',
			projectId: 'project-2',
		})

		expect(next.selectedProjectId).toBe('project-2')
	})

	it('ignores selecting a project that does not exist', () => {
		const next = globalReducer(baseState, {
			type: 'project/select',
			projectId: 'project-unknown',
		})

		expect(next.selectedProjectId).toBe('project-1')
	})

	it('clears the selection', () => {
		const next = globalReducer(baseState, {
			type: 'project/select',
			projectId: null,
		})

		expect(next.selectedProjectId).toBeNull()
	})

	it('appends a timeline entry', () => {
		const entry = {
			type: 'user_message' as const,
			id: 'entry-1',
			projectId: 'project-1',
			content: 'Hello',
		}

		const next = globalReducer(baseState, {
			type: 'timeline/append',
			entry,
		})

		expect(next.timeline).toEqual([entry])
	})

	it('sets and clears the error state', () => {
		const withError = globalReducer(baseState, {
			type: 'error/set',
			error: 'Something went wrong',
		})
		expect(withError.error).toBe('Something went wrong')

		const cleared = globalReducer(withError, {
			type: 'error/set',
			error: null,
		})
		expect(cleared.error).toBeNull()
	})

	it('sets a pending approval', () => {
		const next = globalReducer(baseState, {
			type: 'approval/set',
			approval: { toolCallId: 'tc-1', tool: 'bash', input: 'ls' },
		})

		expect(next.pendingApproval).toEqual({
			toolCallId: 'tc-1',
			tool: 'bash',
			input: 'ls',
		})
	})

	it('clears a pending approval', () => {
		const withApproval = globalReducer(baseState, {
			type: 'approval/set',
			approval: { toolCallId: 'tc-1', tool: 'bash', input: 'ls' },
		})

		const next = globalReducer(withApproval, { type: 'approval/clear' })
		expect(next.pendingApproval).toBeNull()
	})

	it('rejects invalid actions', () => {
		expect(() =>
			globalReducer(baseState, { type: 'unknown' } as unknown as GlobalAction),
		).toThrow()
	})
})
