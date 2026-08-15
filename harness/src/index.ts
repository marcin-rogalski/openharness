import { Server } from '@openharness/tempo'

async function main() {
	const server = new Server({ port: 3000 })

	const driven = await import('./composedDriven').then((m) => m.default())
	const usecases = await import('./composedUsecases').then((m) =>
		m.default(driven),
	)
	const driving = await import('./composedDriving').then((m) =>
		m.default(usecases),
	)

	for (const endpoint of driving) {
		server.use(endpoint)
	}

	const port = await server.start()
	console.log(`Server running on port ${port}`)
}

main().catch((err) => {
	console.error('Failed to start server:', err)
	process.exit(1)
})
