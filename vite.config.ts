import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': 'http://localhost:8787'
    }
  },
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, 'server', 'dist'),
    chunkSizeWarningLimit: 1024
  },
  publicDir: 'public',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
