import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/App'
import { createHarnessApiClient } from '@/service/api/HarnessApiClient'
import { GlobalProvider } from '@/service/GlobalService'
import { emptyState } from '@/service/initialState'
import '@/styles/global.scss'

const root = document.getElementById('root')
if (!root) {
	throw new Error('Missing #root element')
}

const api = createHarnessApiClient()

createRoot(root).render(
	<StrictMode>
		<GlobalProvider initialState={emptyState} api={api}>
			<App />
		</GlobalProvider>
	</StrictMode>,
)
