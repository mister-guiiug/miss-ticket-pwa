import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { pwaSeoPlugin } from '@mister-guiiug/dev-wpa-config/vite-pwa-base';

export default defineConfig(() => {
  // Base '/' historique (deploy avec use-base-path: false). `VITE_BASE_PATH`
  // reste honorée si fournie (Lighthouse CI, éventuel passage sous /repo/).
  const basePath = process.env.VITE_BASE_PATH ?? '/';

  return {
    plugins: [
      react(),
      // SEO partagé famille : canonical/OG via placeholders index.html +
      // sitemap.xml/robots.txt générés au build. Le basePath SEO est celui
      // de l'URL publique GitHub Pages, indépendant de la base des assets.
      pwaSeoPlugin({
        siteName: 'Miss Ticket',
        basePath: '/miss-ticket-pwa/',
        logoPath: '/icon-192.svg',
      }),
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
    base: basePath,
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
  };
});
