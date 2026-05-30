import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'pwa',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/ws') {
            res.setHeader('Access-Control-Allow-Origin', '*');
          }
          next();
        });
      },
    },
  ],
  base: '/',
  server: {
    port: 1420,
    strictPort: true,
    host: true,
    proxy: {
      '/ws': {
        target: 'ws://127.0.0.1:8765',
        ws: true,
      },
    },
  },
});
