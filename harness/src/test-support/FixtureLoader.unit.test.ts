import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
	FixtureLoadError,
	loadFixture,
	loadFixtureDirectory,
} from './FixtureLoader'

function createTempFixture(name: string, content: object): string {
	const dir = mkdtempSync(path.join(tmpdir(), 'fixture-'))
	const filePath = path.join(dir, `${name}.json`)
	writeFileSync(filePath, JSON.stringify(content))
	return filePath
}

describe('FixtureLoader', () => {
	it('loads a valid fixture from a file', () => {
		const filePath = createTempFixture('test', {
			name: 'simple',
			turns: [{ thinking: null, toolCalls: [], response: 'Hello' }],
		})

		const fixture = loadFixture(filePath)

		expect(fixture.name).toBe('simple')
		expect(fixture.turns).toHaveLength(1)
		expect(fixture.turns[0].response).toBe('Hello')

		rmSync(path.dirname(filePath), { recursive: true })
	})

	it('throws FixtureLoadError for missing file', () => {
		expect(() => loadFixture('/nonexistent/path.json')).toThrow(
			FixtureLoadError,
		)
	})

	it('throws FixtureLoadError for invalid JSON', () => {
		const dir = mkdtempSync(path.join(tmpdir(), 'fixture-'))
		const filePath = path.join(dir, 'bad.json')
		writeFileSync(filePath, 'not json')

		expect(() => loadFixture(filePath)).toThrow(FixtureLoadError)

		rmSync(dir, { recursive: true })
	})

	it('throws FixtureLoadError for schema validation failure', () => {
		const filePath = createTempFixture('invalid', {
			name: 'bad',
			turns: [],
		})

		expect(() => loadFixture(filePath)).toThrow(FixtureLoadError)

		rmSync(path.dirname(filePath), { recursive: true })
	})

	it('loads all fixtures from a directory', () => {
		const dir = mkdtempSync(path.join(tmpdir(), 'fixture-dir-'))
		writeFileSync(
			path.join(dir, 'a.json'),
			JSON.stringify({
				name: 'fixture-a',
				turns: [{ thinking: null, toolCalls: [], response: 'A' }],
			}),
		)
		writeFileSync(
			path.join(dir, 'b.json'),
			JSON.stringify({
				name: 'fixture-b',
				turns: [{ thinking: null, toolCalls: [], response: 'B' }],
			}),
		)
		writeFileSync(path.join(dir, 'ignore.txt'), 'not a fixture')

		const fixtures = loadFixtureDirectory(dir)

		expect(fixtures.size).toBe(2)
		expect(fixtures.has('fixture-a')).toBe(true)
		expect(fixtures.has('fixture-b')).toBe(true)

		rmSync(dir, { recursive: true })
	})

	it('throws for nonexistent directory', () => {
		expect(() => loadFixtureDirectory('/nonexistent/dir')).toThrow(
			FixtureLoadError,
		)
	})
})
