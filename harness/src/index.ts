import { mkdirSync } from 'node:fs'
import { Server } from '@openharness/tempo'
import composeDriven from './composedDriven'
import composeDriving from './composedDriving'
import composeUsecases from './composedUsecases'
import { bootstrapConfig } from './infrastructure/driven/bootstrapConfig'
import EventStreamEndpoint from './infrastructure/driving/EventStreamEndpoint'

async function main() {
	const { config, repository, configPath } = await bootstrapConfig()
	mkdirSync(config.projectsDir, { recursive: true })

	const server = new Server({ port: config.port, cors: true })

	const driven = await composeDriven(repository)
	const usecases = composeUsecases(driven)
	const driving = composeDriving(usecases)

	for (const endpoint of driving) {
		server.use(endpoint)
	}

	const eventStream = new EventStreamEndpoint(
		driven.eventPublisher,
		driven.eventLog,
	)
	eventStream.register(server)

	const port = await server.start()
	console.log(`Server running on port ${port}`)
	console.log(`Config file: ${configPath}`)
	console.log(`Projects dir: ${config.projectsDir}`)
}

main().catch((err) => {
	console.error('Failed to start server:', err)
	process.exit(1)
})
