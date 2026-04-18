import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  plugins: [
    solidPlugin(),
    {
      name: 'pwa',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/ws') {
            res.setHeader('Access-Control-Allow-Origin', '*');
          }
          next();
        });
      }
    }
  ],
  base: '/miss-ticket-pwa/',
  server: {
    port: 3000,
    proxy: {
      '/ws': {
        target: 'ws://127.0.0.1:8765',
        ws: true
      }
    }
  }
});
