export default class ActiveTurnRegistry {
	private readonly controllers = new Map<string, AbortController>()

	register(sessionId: string, controller: AbortController): void {
		this.controllers.set(sessionId, controller)
	}

	unregister(sessionId: string): void {
		this.controllers.delete(sessionId)
	}

	abort(sessionId: string): boolean {
		const controller = this.controllers.get(sessionId)
		if (!controller) {
			return false
		}
		controller.abort()
		this.controllers.delete(sessionId)
		return true
	}

	has(sessionId: string): boolean {
		return this.controllers.has(sessionId)
	}
}
