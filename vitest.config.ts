import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	plugins: [svelte({ hot: false })],
	test: {
		environment: 'jsdom',
		globals: true,
	},
	resolve: {
		alias: {
			obsidian: new URL('./src/__mocks__/obsidian.ts', import.meta.url).pathname,
		},
	},
});
