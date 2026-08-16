import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import type { HarnessConfig } from '@/domain/Config'
import JsonConfigRepositoryAdapter from './JsonConfigRepositoryAdapter'

const validConfig: HarnessConfig = {
	schemaVersion: 1,
	port: 3000,
	projectsDir: '/tmp/openharness/projects',
}

async function createConfigPath(): Promise<string> {
	const dir = await mkdtemp(path.join(os.tmpdir(), 'openharness-config-'))
	return path.join(dir, 'config.json')
}

describe('JsonConfigRepositoryAdapter', () => {
	it('returns null when the config file is missing', async () => {
		const adapter = new JsonConfigRepositoryAdapter(await createConfigPath())

		await expect(adapter.load()).resolves.toBeNull()
	})

	it('saves and loads a config file', async () => {
		const configPath = await createConfigPath()
		const adapter = new JsonConfigRepositoryAdapter(configPath)

		await adapter.save(validConfig)
		await expect(adapter.load()).resolves.toEqual(validConfig)
		expect(await readFile(configPath, 'utf8')).toContain('"schemaVersion": 1')
	})

	it('throws for invalid JSON', async () => {
		const configPath = await createConfigPath()
		await writeFile(configPath, 'not-json', 'utf8')
		const adapter = new JsonConfigRepositoryAdapter(configPath)

		await expect(adapter.load()).rejects.toThrow('Invalid harness config')
	})

	it('throws for an invalid config schema', async () => {
		const configPath = await createConfigPath()
		await writeFile(configPath, JSON.stringify({ port: 3000 }), 'utf8')
		const adapter = new JsonConfigRepositoryAdapter(configPath)

		await expect(adapter.load()).rejects.toThrow('Invalid harness config')
	})

	it('rethrows non-ENOENT read errors', async () => {
		const dir = await mkdtemp(path.join(os.tmpdir(), 'openharness-config-'))
		const adapter = new JsonConfigRepositoryAdapter(dir)

		await expect(adapter.load()).rejects.toMatchObject({ code: 'EISDIR' })
	})
})
