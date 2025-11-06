import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  // API 키는 이제 Cloudflare Functions에서만 사용되므로 클라이언트 빌드에서는 제거됨
  
  return {
    base: '/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      rollupOptions: {
        output: {
          manualChunks: undefined
        }
      }
    }
  };
});
