import type { HarnessConfig } from '@/domain/Config'

export interface GetConfigOutput {
	config: HarnessConfig
}

export interface GetConfigUseCasePort {
	handle(): Promise<GetConfigOutput>
}
