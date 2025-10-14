import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	kit: { 
		adapter: adapter({
			// Output directory for the built application
			out: 'build',
			// Precompress files with gzip and brotli
			precompress: false,
			// Environment variable prefix
			envPrefix: 'VITE_',
			// Force CommonJS output for IIS compatibility
			polyfill: false
		}) ,
		paths:{
			base: process.env.NODE_ENV === 'production' ? '/ris' : '',
			relative: false // Important for IIS hosting
		}
	}
};

export default config;
