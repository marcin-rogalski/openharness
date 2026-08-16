import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
	test: {
		environment: 'jsdom',
		globals: false,
		setupFiles: ['./src/test/setup.ts'],
		css: false,
		include: ['src/**/*.test.{ts,tsx}'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'lcov'],
			include: [
				'src/service/**/*.ts',
				'src/service/**/*.tsx',
				'src/components/**/*.tsx',
				'src/App.tsx',
				'src/Root.tsx',
			],
			exclude: ['src/main.tsx', 'src/test/**', 'src/**/*.d.ts'],
			thresholds: {
				statements: 90,
				branches: 90,
				functions: 90,
				lines: 90,
			},
		},
	},
})
