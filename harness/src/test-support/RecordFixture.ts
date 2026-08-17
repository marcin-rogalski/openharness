import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type { SessionEvent } from '@/domain/SessionEvent'
import type { ReplayFixture, ReplayTurn } from './FixtureSchema'
import { redactSecrets } from './Normalizer'

export interface RecordOptions {
	name: string
	description?: string
	outputDir: string
}

export function extractTurnsFromEvents(events: SessionEvent[]): ReplayTurn[] {
	const turns: ReplayTurn[] = []
	for (const event of events) {
		if (event.type === 'model_output_received') {
			const payload = event.payload as {
				thinking: string | null
				toolCalls: { tool: string; input: string; output: string }[]
				response: string
			}
			turns.push({
				thinking: payload.thinking,
				toolCalls: payload.toolCalls,
				response: redactSecrets(payload.response),
			})
		}
	}
	return turns
}

export function buildFixture(
	name: string,
	turns: ReplayTurn[],
	description?: string,
): ReplayFixture {
	const fixture: ReplayFixture = { name, turns }
	if (description) {
		fixture.description = description
	}
	return fixture
}

export function writeFixture(
	fixture: ReplayFixture,
	outputDir: string,
): string {
	mkdirSync(outputDir, { recursive: true })
	const filePath = path.join(outputDir, `${fixture.name}.json`)
	writeFileSync(filePath, `${JSON.stringify(fixture, null, 2)}\n`, 'utf-8')
	return filePath
}

export function recordFixture(
	events: SessionEvent[],
	options: RecordOptions,
): string {
	const turns = extractTurnsFromEvents(events)
	if (turns.length === 0) {
		throw new Error('No model_output_received events found to record')
	}
	const fixture = buildFixture(options.name, turns, options.description)
	return writeFixture(fixture, options.outputDir)
}

export function refreshFixture(
	existingPath: string,
	events: SessionEvent[],
): string {
	const { readFileSync } = require('node:fs') as typeof import('node:fs')
	const raw = readFileSync(existingPath, 'utf-8')
	const existing = JSON.parse(raw) as ReplayFixture
	const turns = extractTurnsFromEvents(events)
	if (turns.length === 0) {
		throw new Error('No model_output_received events found to refresh')
	}
	existing.turns = turns
	const dir = path.dirname(existingPath)
	return writeFixture(existing, dir)
}
