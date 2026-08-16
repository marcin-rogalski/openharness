import { afterEach, describe, expect, it } from 'vitest'
import {
	clearUiConfig,
	loadUiConfig,
	saveUiConfig,
	UI_CONFIG_STORAGE_KEY,
} from './UiConfig'

describe('UiConfig', () => {
	afterEach(() => {
		clearUiConfig()
	})

	it('returns null when no config is stored', () => {
		expect(loadUiConfig()).toBeNull()
	})

	it('returns null when the stored config is invalid', () => {
		window.localStorage.setItem(UI_CONFIG_STORAGE_KEY, 'not-json')

		expect(loadUiConfig()).toBeNull()
	})

	it('round-trips a valid config through localStorage', () => {
		saveUiConfig({ schemaVersion: 1, harnessBaseUrl: 'http://localhost:3000' })

		expect(loadUiConfig()).toEqual({
			schemaVersion: 1,
			harnessBaseUrl: 'http://localhost:3000',
		})
	})
})
