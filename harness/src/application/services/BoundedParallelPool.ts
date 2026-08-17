export async function executeBoundedParallel<T, R>(
	items: T[],
	concurrency: number,
	fn: (item: T, index: number) => Promise<R>,
	abortSignal?: AbortSignal,
): Promise<(R | null)[]> {
	const results: (R | null)[] = new Array(items.length).fill(null)
	let nextIndex = 0

	async function worker(): Promise<void> {
		while (true) {
			if (abortSignal?.aborted) return
			const index = nextIndex++
			if (index >= items.length) return
			results[index] = await fn(items[index], index)
		}
	}

	const workerCount = Math.min(concurrency, items.length)
	const workers = Array.from({ length: workerCount }, () => worker())
	await Promise.all(workers)

	return results
}
