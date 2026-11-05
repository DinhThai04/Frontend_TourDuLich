import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [react(), tsconfigPaths(), tailwindcss()],
	server: {
		proxy: {
			'/api': {
				target: 'http://localhost:8888',
				changeOrigin: true,
			},
		},
	},
	build: {
		target: 'es2020',
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (!id.includes('node_modules')) return;
					if (/node_modules[\\/](react|react-dom|react-router|react-router-dom|react-redux|@reduxjs[\\/]toolkit|redux-persist|redux|immer|reselect)[\\/]/.test(id)) {
						return 'react-vendor';
					}
					// Admin-only screens use pro-components; keep it apart from the shared antd core
					// so visitors do not download table/form builders they never open.
					if (/node_modules[\\/]@ant-design[\\/]pro-components[\\/]/.test(id)) {
						return 'antd-pro';
					}
					if (/node_modules[\\/](antd|@ant-design|@ant-design[\\/]v5-patch-for-react-19|@ant-design[\\/]icons)[\\/]/.test(id)) {
						return 'antd';
					}
					if (/node_modules[\\/](socket\.io-client|engine\.io-client|engine\.io-parser|@socket\.io)[\\/]/.test(id)) {
						return 'realtime';
					}
					if (/node_modules[\\/](react-slick|slick-carousel)[\\/]/.test(id)) {
						return 'carousel';
					}
					return 'vendor';
				},
			},
		},
	},
});
