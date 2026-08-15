// Driving adapters — call INTO the app
// Takes usecase ports, returns driving adapters.

import ListProjectsEndpoint from '@/infrastructure/driving/ListProjectsEndpoint'
import SendProjectMessageEndpoint from '@/infrastructure/driving/SendProjectMessageEndpoint'
import type composeUsecases from './composedUsecases'

type Usecases = ReturnType<typeof composeUsecases>

export default function composeDriving(usecases: Usecases) {
	return [
		new ListProjectsEndpoint(usecases.listProjects),
		new SendProjectMessageEndpoint(usecases.sendProjectMessage),
	]
}
