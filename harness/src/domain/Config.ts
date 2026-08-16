export const CONFIG_SCHEMA_VERSION = 1 as const

export interface HarnessConfig {
	schemaVersion: typeof CONFIG_SCHEMA_VERSION
	port: number
	projectsDir: string
}
