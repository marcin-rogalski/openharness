import type { ApprovalPort } from '@/application/ports/adapters/ApprovalPort'
import type {
	ApproveToolCallInput,
	ApproveToolCallOutput,
	ApproveToolCallUseCasePort,
} from '@/application/ports/usecases/ApproveToolCallUseCasePort'
import { ApproveToolCallInputSchema } from '@/application/ports/usecases/ApproveToolCallUseCasePort'

export default class ApproveToolCallUsecase
	implements ApproveToolCallUseCasePort
{
	constructor(private readonly approval: ApprovalPort) {}

	async handle(input: ApproveToolCallInput): Promise<ApproveToolCallOutput> {
		const parsed = ApproveToolCallInputSchema.parse(input)
		this.approval.decide(parsed.toolCallId, 'approved')
		return { toolCallId: parsed.toolCallId, approved: true }
	}
}
