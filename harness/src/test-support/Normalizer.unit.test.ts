import { describe, expect, it } from 'vitest'
import {
	normalizeEvents,
	normalizeId,
	normalizeTimestamp,
	redactSecrets,
} from './Normalizer'

describe('Normalizer', () => {
	describe('normalizeId', () => {
		it('replaces UUIDs with sequential ids', () => {
			const id = '550e8400-e29b-41d4-a716-446655440000'
			expect(normalizeId(id, 0)).toBe('id-0')
			expect(normalizeId(id, 3)).toBe('id-3')
		})

		it('preserves non-UUID ids', () => {
			expect(normalizeId('custom-id', 0)).toBe('custom-id')
		})
	})

	describe('normalizeTimestamp', () => {
		it('replaces ISO timestamps with a fixed value', () => {
			expect(normalizeTimestamp('2026-08-17T12:34:56Z')).toBe(
				'2026-01-01T00:00:00Z',
			)
			expect(normalizeTimestamp('2026-08-17T12:34:56.789Z')).toBe(
				'2026-01-01T00:00:00Z',
			)
		})

		it('preserves non-timestamp strings', () => {
			expect(normalizeTimestamp('not-a-date')).toBe('not-a-date')
		})
	})

	describe('normalizeEvents', () => {
		it('normalizes id and timestamp in each event', () => {
			const events = [
				{
					id: '550e8400-e29b-41d4-a716-446655440000',
					timestamp: '2026-08-17T12:00:00Z',
					type: 'user_message',
				},
				{
					id: '650e8400-e29b-41d4-a716-446655440001',
					timestamp: '2026-08-17T12:00:01Z',
					type: 'model_output',
				},
			]

			const normalized = normalizeEvents(events)

			expect(normalized[0].id).toBe('id-0')
			expect(normalized[0].timestamp).toBe('2026-01-01T00:00:00Z')
			expect(normalized[1].id).toBe('id-1')
			expect(normalized[1].timestamp).toBe('2026-01-01T00:00:00Z')
			expect(normalized[0].type).toBe('user_message')
		})
	})

	describe('redactSecrets', () => {
		it('redacts api keys', () => {
			expect(redactSecrets('api_key=abc123')).toBe('api_key=[REDACTED]')
		})

		it('redacts tokens', () => {
			expect(redactSecrets('token: xyz789')).toBe('token: [REDACTED]')
		})

		it('preserves text without secrets', () => {
			expect(redactSecrets('hello world')).toBe('hello world')
		})
	})
})
