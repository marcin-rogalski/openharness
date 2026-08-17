import type {
	PolicyDecision,
	PolicyPort,
} from '@/application/ports/adapters/PolicyPort'
import type { ToolCall } from '@/domain/ToolCall'

export default class AllowAllPolicyAdapter implements PolicyPort {
	async evaluate(_call: ToolCall): Promise<PolicyDecision> {
		return 'allow'
	}
}
