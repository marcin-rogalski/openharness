import os from 'node:os'
import path from 'node:path'

export interface HarnessConfig {
	port: number
	projectsDir: string
}

function resolvePort(value: string | undefined): number {
	const parsed = Number(value)
	if (!Number.isFinite(parsed) || parsed <= 0) {
		return 3000
	}
	return parsed
}

function expandHome(value: string, home: string = os.homedir()): string {
	if (value === '~') {
		return home
	}
	if (value.startsWith('~/')) {
		return path.join(home, value.slice(2))
	}
	return value
}

export function loadConfig(
	env: Record<string, string | undefined> = process.env,
	cwd: string = process.cwd(),
): HarnessConfig {
	const port = resolvePort(env.HARNESS_PORT ?? env.PORT)
	const rawProjectsDir = env.PROJECTS_DIR ?? path.join(cwd, 'projects')
	const expandedProjectsDir = expandHome(rawProjectsDir)
	const projectsDir = path.isAbsolute(expandedProjectsDir)
		? expandedProjectsDir
		: path.resolve(cwd, expandedProjectsDir)

	return { port, projectsDir }
}
