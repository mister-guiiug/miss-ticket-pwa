import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import react from '@vitejs/plugin-react';
import { pwaSeoPlugin } from '@mister-guiiug/dev-pwa-config/vite-pwa-base';
import { cspPlugin } from '@mister-guiiug/dev-pwa-config/vite-csp';

export default defineConfig(({ command }) => {
  // LE SITE VIT SOUS `/miss-ticket-pwa/`, ET LES ASSETS DOIVENT LE SAVOIR.
  //
  // La base valait `/` depuis le 03/06/2026 (« base historique », avec
  // `use-base-path: false` au déploiement). Vite écrivait donc
  // `<script src="/assets/…">` : servi par GitHub Pages sous
  // `mister-guiiug.github.io/miss-ticket-pwa/`, ce chemin part de la RACINE de
  // l'origine et répond 404. La page se chargeait sans une ligne de JS ni de
  // CSS — blanche, sans la moindre erreur visible côté build.
  //
  // Le manifeste avait déjà été corrigé (`id`, `start_url` et icônes en
  // `/miss-ticket-pwa/…`), et le lien du manifeste rendu relatif : deux
  // rustines sur le symptôme, jamais sur la cause.
  //
  // `VITE_BASE_PATH` reste honorée — c'est elle que pose `pwa-deploy.yml` — et
  // le défaut vaut désormais la même chose, pour qu'un build local rende ce que
  // la production sert.
  const basePath = process.env.VITE_BASE_PATH ?? '/miss-ticket-pwa/';

  return {
    plugins: [
      react(),
      // SEO partagé famille : canonical/OG via placeholders index.html +
      // sitemap.xml/robots.txt générés au build. Le basePath SEO est celui
      // de l'URL publique GitHub Pages, indépendant de la base des assets.
      pwaSeoPlugin({
        // Deux <meta name="theme-color"> par schéma : la barre du navigateur suit
        // le mode sombre dès le premier rendu (relevé du 02/09/2026 : 5 apps sur 16).
        themeColor: { light: '#ffffff', dark: '#0a0a0a' },
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
      // Service worker (coquille hors-ligne) — enregistré depuis src/main.tsx
      // (import bundlé, pas de script inline). manifest:false : on garde le
      // public/manifest.json écrit à la main et son <link rel="manifest">.
      VitePWA({
        // `prompt`, pas `autoUpdate` : un déploiement ne recharge plus la page
        // en pleine session ; le bandeau du socle (AppUpdates, main.tsx) laisse
        // l'utilisateur choisir le moment.
        registerType: 'prompt',
        injectRegister: false,
        manifest: false,
        includeAssets: [
          'favicon.svg',
          'icon-192.svg',
          'icon-512.svg',
          'manifest.json',
        ],
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,json}'],
          navigateFallback: 'index.html',
          navigateFallbackDenylist: [/^\/ws/],
          cleanupOutdatedCaches: true,
          maximumFileSizeToCacheInBytes: 4_000_000,
        },
      }),
      // CSP durcie : aucun script inline dans index.html → script-src 'self'
      // (drop-to-self). connect-src Firebase (googleapis) porté depuis l'ancienne
      // meta statique, désormais retirée.
      cspPlugin({
        dev: command === 'serve',
        connectSrc: ["'self'", 'https://*.googleapis.com'],
        extraDirectives: { 'frame-ancestors': "'none'" },
      }),
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
