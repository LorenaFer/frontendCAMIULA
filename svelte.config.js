import adapterAuto from '@sveltejs/adapter-auto';
import adapterNode from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// ─── Selección de adapter ────────────────────────────────────
//
// BUILD_TARGET=node   → adapter-node explícito (VPS, Docker, CI)
// (sin BUILD_TARGET)  → adapter-auto (Vercel detecta VERCEL=1 automáticamente)
//
// Esto es backward-compatible: Vercel nunca setea BUILD_TARGET=node,
// por lo que sigue recibiendo adapter-auto → Vercel output API.
// El Dockerfile de producción setea BUILD_TARGET=node en el builder stage.
//
const adapter =
	process.env.BUILD_TARGET === 'node' ? adapterNode() : adapterAuto();

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter,
		alias: {
			'$shared': './src/lib/shared',
			'$shared/*': './src/lib/shared/*',
			'$domain': './src/lib/domain',
			'$domain/*': './src/lib/domain/*'
		}
	}
};

export default config;
