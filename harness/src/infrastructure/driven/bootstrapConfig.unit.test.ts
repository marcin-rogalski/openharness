import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
	bootstrapConfig,
	createDefaultConfig,
	parseHarnessPort,
	resolveConfigPath,
	resolveDataDir,
} from './bootstrapConfig'

async function createHomeDir(): Promise<string> {
	return mkdtemp(path.join(os.tmpdir(), 'openharness-home-'))
}

describe('resolveConfigPath', () => {
	it('expands a bare tilde', () => {
		expect(resolveConfigPath('~', '/cwd', '/home')).toBe('/home')
	})

	it('expands a tilde path', () => {
		expect(resolveConfigPath('~/data', '/cwd', '/home')).toBe(
			path.join('/home', 'data'),
		)
	})

	it('resolves relative paths against cwd', () => {
		expect(resolveConfigPath('data', '/cwd', '/home')).toBe(
			path.join('/cwd', 'data'),
		)
	})

	it('keeps absolute paths unchanged', () => {
		expect(resolveConfigPath('/data', '/cwd', '/home')).toBe('/data')
	})
})

describe('resolveDataDir', () => {
	it('defaults to ~/.openharness', () => {
		expect(resolveDataDir({}, '/cwd', '/home')).toBe(
			path.join('/home', '.openharness'),
		)
	})

	it('uses OPENHARNESS_DATA_DIR', () => {
		expect(
			resolveDataDir({ OPENHARNESS_DATA_DIR: '/custom' }, '/cwd', '/home'),
		).toBe('/custom')
	})
})

describe('parseHarnessPort', () => {
	it('defaults to 3000 when no port is provided', () => {
		expect(parseHarnessPort({})).toBe(3000)
	})

	it('reads HARNESS_PORT', () => {
		expect(parseHarnessPort({ HARNESS_PORT: '4000' })).toBe(4000)
	})

	it('falls back to PORT', () => {
		expect(parseHarnessPort({ PORT: '5000' })).toBe(5000)
	})

	it('ignores invalid values', () => {
		expect(parseHarnessPort({ HARNESS_PORT: 'not-a-port' })).toBe(3000)
	})
})

describe('createDefaultConfig', () => {
	it('uses the data dir projects folder by default', () => {
		expect(createDefaultConfig('/data', {}, '/cwd', '/home')).toEqual({
			schemaVersion: 1,
			port: 3000,
			projectsDir: path.join('/data', 'projects'),
			openaiModel: 'gpt-4o-mini',
			openaiBaseUrl: null,
		})
	})

	it('uses PROJECTS_DIR when provided', () => {
		expect(
			createDefaultConfig(
				'/data',
				{ PROJECTS_DIR: '~/projects' },
				'/cwd',
				'/home',
			),
		).toMatchObject({ projectsDir: path.join('/home', 'projects') })
	})
})

describe('bootstrapConfig', () => {
	it('seeds a missing config from env and defaults', async () => {
		const homeDir = await createHomeDir()
		const dataDir = path.join(homeDir, 'data')
		const env = {
			OPENHARNESS_DATA_DIR: dataDir,
			HARNESS_PORT: '4000',
			PROJECTS_DIR: '~/projects',
		}

		const result = await bootstrapConfig({ env, cwd: '/cwd', homeDir })

		expect(result.config).toEqual({
			schemaVersion: 1,
			port: 4000,
			projectsDir: path.join(homeDir, 'projects'),
			openaiModel: 'gpt-4o-mini',
			openaiBaseUrl: null,
		})
		expect(result.configPath).toBe(path.join(dataDir, 'config.json'))
		expect(await readFile(result.configPath, 'utf8')).toContain('"port": 4000')
	})

	it('prefers an existing config file over env values', async () => {
		const homeDir = await createHomeDir()
		const dataDir = path.join(homeDir, 'data')
		const configPath = path.join(dataDir, 'config.json')
		await mkdir(dataDir, { recursive: true })
		await writeFile(
			configPath,
			JSON.stringify({
				schemaVersion: 1,
				port: 5000,
				projectsDir: '/existing/projects',
				openaiModel: 'gpt-4o-mini',
				openaiBaseUrl: null,
			}),
			'utf8',
		)
		const env = {
			OPENHARNESS_DATA_DIR: dataDir,
			HARNESS_PORT: '4000',
			PROJECTS_DIR: '/env/projects',
		}

		const result = await bootstrapConfig({ env, cwd: '/cwd', homeDir })

		expect(result.config).toEqual({
			schemaVersion: 1,
			port: 5000,
			projectsDir: '/existing/projects',
			openaiModel: 'gpt-4o-mini',
			openaiBaseUrl: null,
		})
	})

	it('fails loudly when the existing config is invalid', async () => {
		const homeDir = await createHomeDir()
		const dataDir = path.join(homeDir, 'data')
		const configPath = path.join(dataDir, 'config.json')
		await mkdir(dataDir, { recursive: true })
		await writeFile(configPath, JSON.stringify({ port: 3000 }), 'utf8')
		const env = { OPENHARNESS_DATA_DIR: dataDir }

		await expect(
			bootstrapConfig({ env, cwd: '/cwd', homeDir }),
		).rejects.toThrow('Invalid harness config')
	})

	it('falls back to process env, cwd, and home dir when options are omitted', async () => {
		const dataDir = await mkdtemp(
			path.join(os.tmpdir(), 'openharness-bootstrap-'),
		)
		const originalDataDir = process.env.OPENHARNESS_DATA_DIR
		process.env.OPENHARNESS_DATA_DIR = dataDir

		try {
			const result = await bootstrapConfig()

			expect(result.configPath).toBe(path.join(dataDir, 'config.json'))
		} finally {
			if (originalDataDir === undefined) {
				delete process.env.OPENHARNESS_DATA_DIR
			} else {
				process.env.OPENHARNESS_DATA_DIR = originalDataDir
			}
		}
	})
})
