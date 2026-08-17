import path from 'node:path'
import type { SandboxPort } from '@/application/ports/adapters/SandboxPort'
import type { SandboxDecision, SandboxPolicy } from '@/domain/Sandbox'
import { SandboxUnavailableError } from '@/domain/SandboxUnavailableError'
import type { SandboxLevel } from '@/domain/ToolDefinition'

const levelOrder: Record<SandboxLevel, number> = {
	none: 0,
	'read-only': 1,
	'workspace-write': 2,
	full: 3,
}

export default class LogicalPathSandboxAdapter implements SandboxPort {
	constructor(private readonly policy: SandboxPolicy) {}

	async checkAccess(
		requiredLevel: SandboxLevel,
		accessPath?: string,
	): Promise<SandboxDecision> {
		if (requiredLevel === 'none') {
			return { allowed: true, reason: null }
		}

		if (levelOrder[this.policy.level] < levelOrder[requiredLevel]) {
			return {
				allowed: false,
				reason: `Tool requires '${requiredLevel}' but session allows '${this.policy.level}'`,
			}
		}

		const isWrite =
			requiredLevel === 'workspace-write' || requiredLevel === 'full'

		if (isWrite && this.policy.level === 'read-only') {
			return {
				allowed: false,
				reason: 'Write denied: session is read-only',
			}
		}

		if (isWrite && this.policy.level === 'workspace-write') {
			if (!this.policy.workspaceRoot) {
				throw new SandboxUnavailableError(
					'Workspace root is not configured for workspace-write access',
				)
			}

			if (accessPath) {
				const resolved = path.resolve(accessPath)
				const root = path.resolve(this.policy.workspaceRoot)
				if (resolved !== root && !resolved.startsWith(root + path.sep)) {
					return {
						allowed: false,
						reason: `Write denied: path is outside workspace`,
					}
				}
			}

			return { allowed: true, reason: null }
		}

		return { allowed: true, reason: null }
	}
}
