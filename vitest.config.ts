import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.test.ts'],
		alias: {
			'$lib': '/src/lib',
			'$shared': '/src/lib/shared'
		}
	}
});
