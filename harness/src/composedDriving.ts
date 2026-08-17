// Driving adapters — call INTO the app
// Takes usecase ports, returns driving adapters.

import ApproveToolCallEndpoint from '@/infrastructure/driving/ApproveToolCallEndpoint'
import DenyToolCallEndpoint from '@/infrastructure/driving/DenyToolCallEndpoint'
import GetConfigEndpoint from '@/infrastructure/driving/GetConfigEndpoint'
import HealthEndpoint from '@/infrastructure/driving/HealthEndpoint'
import ListProjectsEndpoint from '@/infrastructure/driving/ListProjectsEndpoint'
import SendProjectMessageEndpoint from '@/infrastructure/driving/SendProjectMessageEndpoint'
import UpdateConfigEndpoint from '@/infrastructure/driving/UpdateConfigEndpoint'
import type composeUsecases from './composedUsecases'

type Usecases = ReturnType<typeof composeUsecases>

export default function composeDriving(usecases: Usecases) {
	return [
		new HealthEndpoint(),
		new ListProjectsEndpoint(usecases.listProjects),
		new SendProjectMessageEndpoint(usecases.sendProjectMessage),
		new GetConfigEndpoint(usecases.getConfig),
		new UpdateConfigEndpoint(usecases.updateConfig),
		new ApproveToolCallEndpoint(usecases.approveToolCall),
		new DenyToolCallEndpoint(usecases.denyToolCall),
	]
}
