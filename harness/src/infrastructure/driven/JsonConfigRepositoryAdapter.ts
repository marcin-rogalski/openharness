import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { ConfigRepositoryPort } from '@/application/ports/adapters/ConfigRepositoryPort'
import type { HarnessConfig } from '@/domain/Config'
import { ConfigDto } from '@/infrastructure/dtos/ConfigDto'

export default class JsonConfigRepositoryAdapter
	implements ConfigRepositoryPort
{
	constructor(private readonly configPath: string) {}

	async load(): Promise<HarnessConfig | null> {
		let raw: string

		try {
			raw = await readFile(this.configPath, 'utf8')
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
				return null
			}
			throw error
		}

		try {
			return ConfigDto.parse(JSON.parse(raw))
		} catch (error) {
			throw new Error(
				`Invalid harness config at ${this.configPath}: ${
					error instanceof Error ? error.message : String(error)
				}`,
			)
		}
	}

	async save(config: HarnessConfig): Promise<void> {
		await mkdir(path.dirname(this.configPath), { recursive: true })
		await writeFile(
			this.configPath,
			`${JSON.stringify(config, null, 2)}\n`,
			'utf8',
		)
	}
}
