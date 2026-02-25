/// <reference types="vitest" />
import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    css: true,
  },
  resolve: {
    alias: {
      '@shared/types': path.resolve(__dirname, '../../packages/types'),
      '@shared/constants': path.resolve(__dirname, '../../packages/constants'),
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
