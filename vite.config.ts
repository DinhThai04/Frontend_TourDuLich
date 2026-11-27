import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [react(), tsconfigPaths(), tailwindcss()],
	server: {
		proxy: {
			'/socket.io': {
				target: 'ws://localhost:8099',
				ws: true,
			},
			'/api': {
				target: 'http://localhost:8888',
				changeOrigin: true,
			},
		},
	},
	build: {
		target: 'es2020',
        // Use automatic shared chunks from the lazy route graph. Manual vendor buckets
        // created an evaluation cycle that crashed before React mounted in production.
	},
});
