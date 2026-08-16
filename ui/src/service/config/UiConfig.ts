import { z } from 'zod'

export const UI_CONFIG_STORAGE_KEY = 'openharness.ui-config.v1'
export const DEFAULT_HARNESS_BASE_URL = 'http://localhost:3000'

export const UiConfigSchema = z.object({
	schemaVersion: z.literal(1),
	harnessBaseUrl: z.string(),
})

export type UiConfig = z.infer<typeof UiConfigSchema>

export function loadUiConfig(): UiConfig | null {
	const raw = window.localStorage.getItem(UI_CONFIG_STORAGE_KEY)
	if (!raw) {
		return null
	}

	try {
		return UiConfigSchema.parse(JSON.parse(raw))
	} catch {
		return null
	}
}

export function saveUiConfig(config: UiConfig): void {
	window.localStorage.setItem(UI_CONFIG_STORAGE_KEY, JSON.stringify(config))
}

export function clearUiConfig(): void {
	window.localStorage.removeItem(UI_CONFIG_STORAGE_KEY)
}
