import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = fileURLToPath(new URL('../../', import.meta.url))
const integrationDir = fileURLToPath(new URL('../', import.meta.url))
const projectsDir = join(homedir(), '.openharness', 'projects')

mkdirSync(projectsDir, { recursive: true })

function run(command, args, options = {}) {
	const result = spawnSync(command, args, {
		stdio: 'inherit',
		...options,
	})

	if (result.error) {
		throw result.error
	}

	return result
}

function runOrThrow(command, args, options = {}) {
	const result = run(command, args, options)

	if (result.status !== 0) {
		throw new Error(
			`${command} ${args.join(' ')} failed with status ${result.status}`,
		)
	}
}

function getPort(service, containerPort) {
	const output = execFileSync(
		'docker',
		['compose', 'port', service, containerPort],
		{ cwd: rootDir, encoding: 'utf8' },
	)
	const port = output.trim().split(':').pop()

	if (!port) {
		throw new Error(`Unable to resolve port for ${service}`)
	}

	return port
}

async function waitForHttp(url) {
	for (let attempt = 0; attempt < 60; attempt += 1) {
		try {
			const response = await fetch(url)
			await response.body?.cancel()
			return
		} catch {
			await new Promise((resolve) => setTimeout(resolve, 1000))
		}
	}

	throw new Error(`Service did not become ready at ${url}`)
}

let composeStarted = false

try {
	runOrThrow('docker', ['compose', 'up', '--build', '-d'], {
		cwd: rootDir,
	})
	composeStarted = true

	const harnessBaseUrl = `http://127.0.0.1:${getPort('harness', '3000')}`
	const uiBaseUrl = `http://127.0.0.1:${getPort('ui', '80')}`

	await waitForHttp(harnessBaseUrl)
	await waitForHttp(uiBaseUrl)

	const env = {
		...process.env,
		HARNESS_BASE_URL: harnessBaseUrl,
		UI_BASE_URL: uiBaseUrl,
	}

	runOrThrow('npm', ['run', 'test:compose'], {
		cwd: integrationDir,
		env,
	})
	runOrThrow('npm', ['run', 'test:e2e'], {
		cwd: integrationDir,
		env,
	})

	console.log('integration check passed')
} finally {
	if (composeStarted) {
		run('docker', ['compose', 'down', '--remove-orphans'], {
			cwd: rootDir,
		})
	}
}
