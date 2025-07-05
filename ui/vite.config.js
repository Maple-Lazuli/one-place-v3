import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',       // Allow connections from outside the container
    port: 3000,            // Vite dev server port
    proxy: {
      '/todos': {
        target: 'http://backend:3001', // Use Docker service name, not localhost
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
