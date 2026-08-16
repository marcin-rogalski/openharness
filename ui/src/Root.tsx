import { useMemo, useState } from 'react'
import App from '@/App'
import ConnectionPrompt from '@/components/ConnectionPrompt'
import type { HarnessApi } from '@/service/api/HarnessApi'
import { createHarnessApiClient } from '@/service/api/HarnessApiClient'
import {
	loadUiConfig,
	saveUiConfig,
	type UiConfig,
} from '@/service/config/UiConfig'
import { GlobalProvider } from '@/service/GlobalService'
import { emptyState } from '@/service/initialState'

interface RootProps {
	apiFactory?: (baseUrl: string) => HarnessApi
}

export default function Root({
	apiFactory = createHarnessApiClient,
}: RootProps) {
	const [uiConfig, setUiConfig] = useState<UiConfig | null>(() =>
		loadUiConfig(),
	)
	const api = useMemo(
		() => apiFactory(uiConfig?.harnessBaseUrl ?? ''),
		[apiFactory, uiConfig],
	)

	if (!uiConfig) {
		return (
			<ConnectionPrompt
				apiFactory={apiFactory}
				onConnect={(harnessBaseUrl) => {
					const config: UiConfig = { schemaVersion: 1, harnessBaseUrl }
					saveUiConfig(config)
					setUiConfig(config)
				}}
			/>
		)
	}

	return (
		<GlobalProvider
			key={uiConfig.harnessBaseUrl}
			initialState={emptyState}
			api={api}
		>
			<App
				api={api}
				uiConfig={uiConfig}
				onUiConfigChange={(config) => {
					saveUiConfig(config)
					setUiConfig(config)
				}}
			/>
		</GlobalProvider>
	)
}
