import { defineConfig } from 'tsup'

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['esm'],
	target: 'node20',
	clean: true,
	dts: true,
	sourcemap: true,
	splitting: false,
	treeshake: true,
	noExternal: ['@openharness/tempo'],
	esbuildOptions(options) {
		options.banner = {
			js: "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);",
		}
	},
})
