import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/App'
import { GlobalProvider } from '@/service/GlobalService'
import { mockState } from '@/service/mock'
import '@/styles/global.scss'

const root = document.getElementById('root')
if (!root) {
	throw new Error('Missing #root element')
}

createRoot(root).render(
	<StrictMode>
		<GlobalProvider initialState={mockState}>
			<App />
		</GlobalProvider>
	</StrictMode>,
)
