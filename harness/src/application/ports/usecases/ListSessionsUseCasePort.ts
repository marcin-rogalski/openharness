import { z } from 'zod'

export const ListSessionsInputSchema = z.object({
	projectId: z.string().min(1),
})

export type ListSessionsInput = z.infer<typeof ListSessionsInputSchema>

export interface SessionSummary {
	id: string
	projectId: string
	status: 'active' | 'ended'
	createdAt: string
	endedAt: string | null
	eventCount: number
	lastEventAt: string | null
}

export interface ListSessionsOutput {
	sessions: SessionSummary[]
}

export interface ListSessionsUseCasePort {
	handle(input: ListSessionsInput): Promise<ListSessionsOutput>
}
