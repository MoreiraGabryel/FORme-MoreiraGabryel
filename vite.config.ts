import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const copyrightBanner = {
  name: 'copyright-banner',
  generateBundle(_options: unknown, bundle: Record<string, {type: string; code?: string}>) {
    for (const chunk of Object.values(bundle)) {
      if (chunk.type === 'chunk' && chunk.code !== undefined) {
        chunk.code = `/*! Copyright (c) 2026 MoreiraGabryel. All rights reserved. */\n${chunk.code}`;
      }
    }
  },
};

export default defineConfig({
  plugins: [react(), tailwindcss(), copyrightBanner],
  build: {sourcemap: false},
  server: {
    host: '127.0.0.1',
    port: 3000,
    strictPort: true,
    proxy: {
      '/api/visits': {target: 'http://127.0.0.1:8788', changeOrigin: false},
    },
    watch: {
      ignored: ['**/.omo/**'],
    },
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
  },
});
