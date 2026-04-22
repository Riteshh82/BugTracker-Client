import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Local dev only — proxy forwards /api and /uploads to the backend
    port: 5173,
    proxy: {
      '/api':     { target: 'http://localhost:5001', changeOrigin: true },
      '/uploads': { target: 'http://localhost:5001', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor:   ['react', 'react-dom', 'react-router-dom'],
          charts:   ['recharts'],
          dnd:      ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          motion:   ['framer-motion'],
          socket:   ['socket.io-client'],
        },
      },
    },
  },
});
