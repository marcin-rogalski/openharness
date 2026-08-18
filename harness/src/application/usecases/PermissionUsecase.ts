import type { PermissionRepositoryPort } from '@/application/ports/adapters/PermissionRepositoryPort'
import type {
	CreatePermissionInput,
	CreatePermissionOutput,
	ListPermissionsOutput,
	PermissionUsecasePort,
	UpdatePermissionInput,
	UpdatePermissionOutput,
} from '@/application/ports/usecases/PermissionUsecasePort'

export default class PermissionUsecase implements PermissionUsecasePort {
	constructor(private readonly repository: PermissionRepositoryPort) {}

	async list(): Promise<ListPermissionsOutput> {
		return { permissions: await this.repository.list() }
	}

	async create(input: CreatePermissionInput): Promise<CreatePermissionOutput> {
		return { permission: await this.repository.create(input.permission) }
	}

	async update(input: UpdatePermissionInput): Promise<UpdatePermissionOutput> {
		return { permission: await this.repository.update(input.id, input.permission) }
	}
}
