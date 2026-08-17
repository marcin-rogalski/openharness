import { readFileSync } from 'node:fs'
import path from 'node:path'
import { type ReplayFixture, ReplayFixtureSchema } from './FixtureSchema'

export class FixtureLoadError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'FixtureLoadError'
	}
}

export function loadFixture(filePath: string): ReplayFixture {
	let raw: string
	try {
		raw = readFileSync(filePath, 'utf-8')
	} catch (err) {
		throw new FixtureLoadError(
			`Cannot read fixture file: ${filePath} (${err instanceof Error ? err.message : String(err)})`,
		)
	}

	let parsed: unknown
	try {
		parsed = JSON.parse(raw)
	} catch (err) {
		throw new FixtureLoadError(
			`Invalid JSON in fixture: ${filePath} (${err instanceof Error ? err.message : String(err)})`,
		)
	}

	const result = ReplayFixtureSchema.safeParse(parsed)
	if (!result.success) {
		throw new FixtureLoadError(
			`Fixture schema validation failed: ${result.error.message}`,
		)
	}

	return result.data
}

export function loadFixtureDirectory(
	dirPath: string,
): Map<string, ReplayFixture> {
	const fixtures = new Map<string, ReplayFixture>()
	const resolved = path.resolve(dirPath)

	try {
		const { readdirSync } = require('node:fs') as typeof import('node:fs')
		const entries = readdirSync(resolved)
		for (const entry of entries) {
			if (entry.endsWith('.json')) {
				const filePath = path.join(resolved, entry)
				const fixture = loadFixture(filePath)
				fixtures.set(fixture.name, fixture)
			}
		}
	} catch (err) {
		throw new FixtureLoadError(
			`Cannot read fixture directory: ${dirPath} (${err instanceof Error ? err.message : String(err)})`,
		)
	}

	return fixtures
}
