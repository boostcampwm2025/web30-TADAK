import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared/types': path.resolve(__dirname, '../../packages/types'),
      '@shared/constants': path.resolve(__dirname, '../../packages/constants'),
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: true, // 도커 컨테이너에서 외부 접근 허용
    port: 5173,
    watch: {
      usePolling: true, // 도커 볼륨 마운트에서 파일 변경 감지
    },
    hmr: {
      host: 'localhost', // HMR을 위한 호스트 설정
    },
  },
});
