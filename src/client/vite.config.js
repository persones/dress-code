import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const server = `http://localhost:${process.env.PORT || 3000}`;

export default defineConfig({
  root: import.meta.dirname,
  plugins: [vue()],
  build: {
    outDir: '../../dist/client',
    emptyOutDir: true,
    assetsDir: 'static', // keep /assets for the clothes + weather SVGs
  },
  server: {
    proxy: {
      '/api': server,
      '/assets': server,
    },
  },
});
