import { randomUUID } from 'node:crypto'
import type { ProjectRepositoryPort } from '@/application/ports/adapters/ProjectRepositoryPort'
import type {
	CreateProjectInput,
	CreateProjectOutput,
	CreateProjectUseCasePort,
} from '@/application/ports/usecases/CreateProjectUseCasePort'
import { CreateProjectInputSchema } from '@/application/ports/usecases/CreateProjectUseCasePort'

export default class CreateProjectUsecase implements CreateProjectUseCasePort {
	constructor(private readonly projects: ProjectRepositoryPort) {}

	async handle(input: CreateProjectInput): Promise<CreateProjectOutput> {
		const parsed = CreateProjectInputSchema.parse(input)
		const project = {
			id: randomUUID(),
			name: parsed.name,
			status: 'idle' as const,
		}
		await this.projects.save(project)
		return { project }
	}
}
