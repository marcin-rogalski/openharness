import { describe, expect, it } from 'vitest'
import { EntitySchema, createEntity } from './Entity'

describe('Entity', () => {
	it('should create an entity with valid defaults', () => {
		const entity = createEntity()

		expect(entity.id).toBeDefined()
		expect(entity.createdAt).toBeInstanceOf(Date)
		expect(entity.updatedAt).toBeInstanceOf(Date)
	})

	it('should produce a valid UUID', () => {
		const entity = createEntity()

		expect(() => EntitySchema.parse(entity)).not.toThrow()
	})

	it('should have createdAt equal to updatedAt on creation', () => {
		const entity = createEntity()

		expect(entity.createdAt.getTime()).toBe(entity.updatedAt.getTime())
	})
})
