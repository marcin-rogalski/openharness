import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadConfig } from './config'

describe('loadConfig', () => {
	it('uses defaults when env is empty', () => {
		const config = loadConfig({}, '/tmp/openharness')

		expect(config.port).toBe(3000)
		expect(config.projectsDir).toBe(path.join('/tmp/openharness', 'projects'))
	})

	it('reads harness port and projects dir from env', () => {
		const config = loadConfig(
			{
				HARNESS_PORT: '4000',
				PROJECTS_DIR: '/custom/projects',
			},
			'/tmp/openharness',
		)

		expect(config.port).toBe(4000)
		expect(config.projectsDir).toBe('/custom/projects')
	})

	it('falls back to PORT when HARNESS_PORT is missing', () => {
		const config = loadConfig({ PORT: '5000' }, '/tmp/openharness')

		expect(config.port).toBe(5000)
	})

	it('ignores invalid port values', () => {
		const config = loadConfig(
			{
				HARNESS_PORT: 'not-a-port',
				PROJECTS_DIR: '/custom/projects',
			},
			'/tmp/openharness',
		)

		expect(config.port).toBe(3000)
	})

	it('expands tilde in projects dir', () => {
		const config = loadConfig(
			{ PROJECTS_DIR: '~/.openharness/projects' },
			'/tmp/openharness',
		)

		expect(config.projectsDir).toBe(
			path.join(os.homedir(), '.openharness/projects'),
		)
	})

	it('expands a bare tilde projects dir', () => {
		const config = loadConfig({ PROJECTS_DIR: '~' }, '/tmp/openharness')

		expect(config.projectsDir).toBe(os.homedir())
	})

	it('resolves relative projects dir against cwd', () => {
		const config = loadConfig(
			{ PROJECTS_DIR: 'data/projects' },
			'/tmp/openharness',
		)

		expect(config.projectsDir).toBe('/tmp/openharness/data/projects')
	})
})
