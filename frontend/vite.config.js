import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    cors: true,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.VITE_RENDER_API_PORT || 3001}`,
        changeOrigin: true,
      },
      '/outputs': {
        target: `http://localhost:${process.env.VITE_RENDER_API_PORT || 3001}`,
        changeOrigin: true,
      },
    },
  },
});
