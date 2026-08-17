export interface AgentLoopConfig {
	maxSteps: number
	maxParallelTools: number
}

export const DEFAULT_AGENT_LOOP_CONFIG: AgentLoopConfig = {
	maxSteps: 20,
	maxParallelTools: 10,
}
