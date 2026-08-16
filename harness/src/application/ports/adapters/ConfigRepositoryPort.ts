import type { HarnessConfig } from '@/domain/Config'

export interface ConfigRepositoryPort {
	load(): Promise<HarnessConfig | null>
	save(config: HarnessConfig): Promise<void>
}
