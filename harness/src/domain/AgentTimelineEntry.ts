export type AgentTimelineEntry =
	| {
			type: 'user_message'
			id: string
			projectId: string
			content: string
	  }
	| {
			type: 'agent_thinking'
			id: string
			projectId: string
			text: string
	  }
	| {
			type: 'agent_tool_call'
			id: string
			projectId: string
			tool: string
			status: 'started' | 'completed'
			input?: string
			output?: string
	  }
	| {
			type: 'agent_response'
			id: string
			projectId: string
			text: string
	  }
