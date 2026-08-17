import type { ApprovalPort } from '@/application/ports/adapters/ApprovalPort'
import type {
	DenyToolCallInput,
	DenyToolCallOutput,
	DenyToolCallUseCasePort,
} from '@/application/ports/usecases/DenyToolCallUseCasePort'
import { DenyToolCallInputSchema } from '@/application/ports/usecases/DenyToolCallUseCasePort'

export default class DenyToolCallUsecase implements DenyToolCallUseCasePort {
	constructor(private readonly approval: ApprovalPort) {}

	async handle(input: DenyToolCallInput): Promise<DenyToolCallOutput> {
		const parsed = DenyToolCallInputSchema.parse(input)
		this.approval.decide(parsed.toolCallId, 'denied')
		return { toolCallId: parsed.toolCallId, denied: true }
	}
}
