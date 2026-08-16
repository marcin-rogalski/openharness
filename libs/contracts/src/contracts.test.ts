import { describe, expect, it } from 'vitest'
import {
	ConfigSchema,
	GetConfigResponseSchema,
	getConfigEndpoint,
	HealthResponseSchema,
	harnessApiSchema,
	healthEndpoint,
	ListProjectsResponseSchema,
	listProjectsEndpoint,
	SendMessageBodySchema,
	SendMessageParamsSchema,
	SendMessageResponseSchema,
	sendMessageEndpoint,
	TimelineEntrySchema,
	UpdateConfigBodySchema,
	UpdateConfigResponseSchema,
	updateConfigEndpoint,
} from './index'

describe('health', () => {
	it('parses a healthy response', () => {
		expect(HealthResponseSchema.parse({ status: 'ok' })).toEqual({
			status: 'ok',
		})
	})

	it('rejects an unhealthy response', () => {
		expect(() => HealthResponseSchema.parse({ status: 'nope' })).toThrow()
	})

	it('exposes the GET /api/health endpoint', () => {
		expect(healthEndpoint).toMatchObject({
			method: 'GET',
			path: '/api/health',
		})
	})
})

describe('projects', () => {
	it('parses a project list response', () => {
		const payload = {
			projects: [{ id: 'project-1', name: 'OpenHarness', status: 'running' }],
		}
		expect(ListProjectsResponseSchema.parse(payload)).toEqual(payload)
	})

	it('rejects an unknown project status', () => {
		expect(() =>
			ListProjectsResponseSchema.parse({
				projects: [{ id: 'project-1', name: 'x', status: 'bogus' }],
			}),
		).toThrow()
	})

	it('exposes the GET /api/projects endpoint', () => {
		expect(listProjectsEndpoint).toMatchObject({
			method: 'GET',
			path: '/api/projects',
		})
	})
})

describe('messages', () => {
	it('parses every timeline entry variant', () => {
		expect(
			TimelineEntrySchema.parse({
				type: 'user_message',
				id: 'e1',
				projectId: 'p1',
				content: 'hi',
			}),
		).toMatchObject({ type: 'user_message' })
		expect(
			TimelineEntrySchema.parse({
				type: 'agent_thinking',
				id: 'e2',
				projectId: 'p1',
				text: 'hmm',
			}),
		).toMatchObject({ type: 'agent_thinking' })
		expect(
			TimelineEntrySchema.parse({
				type: 'agent_tool_call',
				id: 'e3',
				projectId: 'p1',
				tool: 'read',
				status: 'completed',
				input: 'a',
				output: 'b',
			}),
		).toMatchObject({ type: 'agent_tool_call' })
		expect(
			TimelineEntrySchema.parse({
				type: 'agent_response',
				id: 'e4',
				projectId: 'p1',
				text: 'done',
			}),
		).toMatchObject({ type: 'agent_response' })
	})

	it('rejects an unknown timeline entry type', () => {
		expect(() =>
			TimelineEntrySchema.parse({ type: 'bogus', id: 'e', projectId: 'p' }),
		).toThrow()
	})

	it('parses send message params and rejects an empty project id', () => {
		expect(SendMessageParamsSchema.parse({ projectId: 'p1' })).toEqual({
			projectId: 'p1',
		})
		expect(() => SendMessageParamsSchema.parse({ projectId: '' })).toThrow()
	})

	it('parses a non-empty message body and rejects an empty one', () => {
		expect(SendMessageBodySchema.parse({ content: 'hello' })).toEqual({
			content: 'hello',
		})
		expect(() => SendMessageBodySchema.parse({ content: '   ' })).toThrow()
	})

	it('parses a send message response', () => {
		const payload = {
			entries: [
				{
					type: 'agent_response',
					id: 'e1',
					projectId: 'p1',
					text: 'done',
				},
			],
		}
		expect(SendMessageResponseSchema.parse(payload)).toEqual(payload)
	})

	it('exposes the POST messages endpoint', () => {
		expect(sendMessageEndpoint).toMatchObject({
			method: 'POST',
			path: '/api/projects/:projectId/messages',
		})
	})
})

describe('config', () => {
	it('parses a valid config and rejects an invalid one', () => {
		const config = { schemaVersion: 1, port: 3000, projectsDir: '/projects' }
		expect(ConfigSchema.parse(config)).toEqual(config)
		expect(() =>
			ConfigSchema.parse({ schemaVersion: 2, port: 3000, projectsDir: '/p' }),
		).toThrow()
	})

	it('parses an update body and rejects an empty one', () => {
		expect(UpdateConfigBodySchema.parse({ port: 4000 })).toEqual({ port: 4000 })
		expect(() => UpdateConfigBodySchema.parse({})).toThrow()
	})

	it('parses get and update config responses', () => {
		const config = { schemaVersion: 1, port: 3000, projectsDir: '/projects' }
		expect(GetConfigResponseSchema.parse({ config })).toEqual({ config })
		expect(
			UpdateConfigResponseSchema.parse({ config, restartRequired: true }),
		).toEqual({ config, restartRequired: true })
	})

	it('exposes the config endpoints', () => {
		expect(getConfigEndpoint).toMatchObject({
			method: 'GET',
			path: '/api/config',
		})
		expect(updateConfigEndpoint).toMatchObject({
			method: 'PUT',
			path: '/api/config',
		})
	})
})

describe('harnessApiSchema', () => {
	it('aggregates every endpoint', () => {
		expect(Object.keys(harnessApiSchema).sort()).toEqual([
			'getConfig',
			'health',
			'listProjects',
			'sendMessage',
			'updateConfig',
		])
	})
})
