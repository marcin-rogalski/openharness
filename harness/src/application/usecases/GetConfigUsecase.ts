import type { ConfigRepositoryPort } from '@/application/ports/adapters/ConfigRepositoryPort'
import type {
	GetConfigOutput,
	GetConfigUseCasePort,
} from '@/application/ports/usecases/GetConfigUseCasePort'

export default class GetConfigUsecase implements GetConfigUseCasePort {
	constructor(private readonly configs: ConfigRepositoryPort) {}

	async handle(): Promise<GetConfigOutput> {
		const config = await this.configs.load()

		if (!config) {
			throw new Error('Harness config is not initialized')
		}

		return { config }
	}
}
