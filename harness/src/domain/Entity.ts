import { z } from 'zod'

export const EntitySchema = z.object({
	id: z.string().uuid(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
})

export type Entity = z.infer<typeof EntitySchema>

export function createEntity(): Entity {
	const now = new Date()
	return {
		id: crypto.randomUUID(),
		createdAt: now,
		updatedAt: now,
	}
}
