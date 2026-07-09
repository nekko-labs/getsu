import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  // relative base → the build works at any path (root in dev, /app/ on Pages)
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@getsu/shared': fileURLToPath(new URL('../../packages/shared/src/index.ts', import.meta.url)),
      '@getsu/core': fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url)),
    },
  },
  server: {
    port: 5179,
  },
});
