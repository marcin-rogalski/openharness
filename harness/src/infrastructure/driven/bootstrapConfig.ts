import os from 'node:os'
import path from 'node:path'
import type { ConfigRepositoryPort } from '@/application/ports/adapters/ConfigRepositoryPort'
import type { HarnessConfig } from '@/domain/Config'
import JsonConfigRepositoryAdapter from './JsonConfigRepositoryAdapter'

export interface BootstrapConfigOptions {
	env?: NodeJS.ProcessEnv
	cwd?: string
	homeDir?: string
}

export interface BootstrapConfigResult {
	config: HarnessConfig
	repository: ConfigRepositoryPort
	configPath: string
	dataDir: string
}

export function resolveConfigPath(
	raw: string,
	cwd: string,
	homeDir: string,
): string {
	if (raw === '~') {
		return homeDir
	}
	if (raw.startsWith('~/')) {
		return path.join(homeDir, raw.slice(2))
	}
	return path.resolve(cwd, raw)
}

export function resolveDataDir(
	env: NodeJS.ProcessEnv,
	cwd: string,
	homeDir: string,
): string {
	const raw = env.OPENHARNESS_DATA_DIR ?? path.join(homeDir, '.openharness')
	return resolveConfigPath(raw, cwd, homeDir)
}

export function parseHarnessPort(env: NodeJS.ProcessEnv): number {
	const raw = env.HARNESS_PORT ?? env.PORT
	const parsed = Number(raw)

	if (
		raw !== undefined &&
		raw !== '' &&
		Number.isInteger(parsed) &&
		parsed >= 1 &&
		parsed <= 65535
	) {
		return parsed
	}

	return 3000
}

export function createDefaultConfig(
	dataDir: string,
	env: NodeJS.ProcessEnv,
	cwd: string,
	homeDir: string,
): HarnessConfig {
	return {
		schemaVersion: 1,
		port: parseHarnessPort(env),
		projectsDir: resolveConfigPath(
			env.PROJECTS_DIR || path.join(dataDir, 'projects'),
			cwd,
			homeDir,
		),
		providers: {
			openai: {
				url: 'https://api.openai.com/v1',
				models: { 'gpt-4o-mini': { label: 'GPT-4o Mini' } },
			},
		},
		defaultModel: 'openai/gpt-4o-mini',
	}
}

export async function bootstrapConfig(
	options: BootstrapConfigOptions = {},
): Promise<BootstrapConfigResult> {
	const env = options.env ?? process.env
	const cwd = options.cwd ?? process.cwd()
	const homeDir = options.homeDir ?? os.homedir()
	const dataDir = resolveDataDir(env, cwd, homeDir)
	const configPath = path.join(dataDir, 'config.json')
	const repository = new JsonConfigRepositoryAdapter(configPath)
	const existing = await repository.load()

	if (existing) {
		const config: HarnessConfig = {
			...existing,
			projectsDir: resolveConfigPath(existing.projectsDir, cwd, homeDir),
		}
		return { config, repository, configPath, dataDir }
	}

	const config = createDefaultConfig(dataDir, env, cwd, homeDir)
	await repository.save(config)

	return { config, repository, configPath, dataDir }
}
