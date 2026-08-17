export const CONFIG_SCHEMA_VERSION = 1 as const

export interface ProviderModelInfo {
	label: string
}

export interface ProviderConfig {
	url: string
	models: Record<string, ProviderModelInfo>
}

export interface HarnessConfig {
	schemaVersion: typeof CONFIG_SCHEMA_VERSION
	port: number
	projectsDir: string
	providers: Record<string, ProviderConfig>
	defaultModel: string
}
