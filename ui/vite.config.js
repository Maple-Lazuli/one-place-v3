import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      // Proxy API requests starting with /api to backend server
      '/api': {
        // target: 'http://localhost:3001', // for local dev
        target: 'http://backend:3001', // for production
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''), // Remove /api prefix before forwarding
      },
    },
  },
});
