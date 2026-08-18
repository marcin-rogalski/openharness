import type { PolicyDecision, PolicyPort } from '@/application/ports/adapters/PolicyPort'
import type { PermissionPort } from '@/application/ports/adapters/PermissionPort'
import type { ToolCall } from '@/domain/ToolCall'

export default class PermissionPolicyAdapter implements PolicyPort {
	constructor(private readonly permissionPort: PermissionPort) {}

	async evaluate(call: ToolCall): Promise<PolicyDecision> {
		const result = await this.permissionPort.check('tool', call.toolId, 'project', null)
		return result.action
	}
}
