import { describe, expect, it, vi } from 'vitest'
import { executeBoundedParallel } from './BoundedParallelPool'

describe('executeBoundedParallel', () => {
	it('executes all items with bounded concurrency', async () => {
		const calls: number[] = []

		const results = await executeBoundedParallel(
			[1, 2, 3, 4, 5],
			2,
			async (item) => {
				calls.push(item)
				return item * 2
			},
		)

		expect(results).toEqual([2, 4, 6, 8, 10])
		expect(calls).toHaveLength(5)
	})

	it('returns empty array for empty items', async () => {
		const results = await executeBoundedParallel<number, number>(
			[],
			3,
			async (item) => item,
		)

		expect(results).toEqual([])
	})

	it('respects concurrency limit', async () => {
		let active = 0
		let maxActive = 0

		const results = await executeBoundedParallel(
			[1, 2, 3, 4, 5, 6],
			2,
			async (item) => {
				active++
				maxActive = Math.max(maxActive, active)
				await new Promise((r) => setTimeout(r, 10))
				active--
				return item
			},
		)

		expect(results).toEqual([1, 2, 3, 4, 5, 6])
		expect(maxActive).toBeLessThanOrEqual(2)
	})

	it('stops processing when abortSignal is aborted', async () => {
		const controller = new AbortController()
		controller.abort()

		const fn = vi.fn(async (item: number) => item)

		const results = await executeBoundedParallel(
			[1, 2, 3],
			2,
			fn,
			controller.signal,
		)

		expect(fn).not.toHaveBeenCalled()
		expect(results).toEqual([null, null, null])
	})
})
