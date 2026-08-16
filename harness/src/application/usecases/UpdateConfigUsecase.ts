import type { ConfigRepositoryPort } from '@/application/ports/adapters/ConfigRepositoryPort'
import type {
	UpdateConfigInput,
	UpdateConfigOutput,
	UpdateConfigUseCasePort,
} from '@/application/ports/usecases/UpdateConfigUseCasePort'
import { UpdateConfigInputSchema } from '@/application/ports/usecases/UpdateConfigUseCasePort'
import type { HarnessConfig } from '@/domain/Config'

export default class UpdateConfigUsecase implements UpdateConfigUseCasePort {
	constructor(private readonly configs: ConfigRepositoryPort) {}

	async handle(input: UpdateConfigInput): Promise<UpdateConfigOutput> {
		const parsed = UpdateConfigInputSchema.parse(input)
		const current = await this.configs.load()

		if (!current) {
			throw new Error('Harness config is not initialized')
		}

		const next: HarnessConfig = {
			...current,
			...(parsed.port !== undefined ? { port: parsed.port } : {}),
			...(parsed.projectsDir !== undefined
				? { projectsDir: parsed.projectsDir }
				: {}),
		}
		const restartRequired = next.port !== current.port

		await this.configs.save(next)

		return { config: next, restartRequired }
	}
}
