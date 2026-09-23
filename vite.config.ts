import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import react from '@vitejs/plugin-react';
import { pwaSeoPlugin } from '@mister-guiiug/dev-pwa-config/vite-pwa-base';
import { cspPlugin } from '@mister-guiiug/dev-pwa-config/vite-csp';
import { versionPlugin } from '@mister-guiiug/dev-pwa-config/vite-version';

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
    build: {
      /*
       * NOMMER N'EST PAS PRÉCHARGER, et ici il a fallu séparer les deux.
       *
       * Cette app n'avait aucun `manualChunks`. En ajouter un, même pour la
       * seule ligne Sentry, l'a fait entrer dans la liste de `modulepreload`
       * de l'entrée : mesuré le 16/09/2026, 435,4 kB préchargés au lieu de
       * 280,1. Le `import()` paresseux était défait par le fait même de
       * nommer le morceau — l'inverse de ce qu'on cherchait.
       *
       * Retirer la règle rendait bien Sentry asynchrone, mais son morceau
       * reprenait un nom automatique (`esm-*`), instable d'une version à
       * l'autre et partagé avec d'autres paquets : `globIgnores` n'aurait plus
       * eu de cible fiable pour l'exclure du précache.
       *
       * D'où les deux options ensemble : `manualChunks` donne le NOM,
       * `resolveDependencies` retire le morceau du PRÉCHARGEMENT. Mesuré
       * ensuite : 278,1 kB préchargés, morceau `sentry-*` présent, absent de
       * `sw.js`.
       */
      modulePreload: {
        resolveDependencies: (_fichier, deps) =>
          deps.filter(d => !/(^|\/)sentry(-[\w-]+)?\.js$/.test(d)),
      },
      rollupOptions: {
        output: {
          /*
           * LE MORCEAU SENTRY GARDE SON NOM, SANS EMPREINTE — parce qu'il est
           * exclu du précache (`globIgnores` plus bas) et qu'une URL empreintée
           * y meurt à chaque déploiement.
           *
           * Le service worker sert la coquille précachée jusqu'à ce que
           * l'utilisateur accepte la mise à jour ; cette coquille demande
           * l'ANCIENNE empreinte, que le déploiement suivant a supprimée de
           * `assets/`. Mesuré en production sur mister-qowa le 22/09/2026 :
           * HTTP 404, « Échec du chargement pour le module » dans la console.
           * `initSentry` avale l'échec (son `try/catch`), donc l'application ne
           * casse pas — elle rapporte ses erreurs à personne, sans le dire.
           *
           * Rien n'est perdu au cache : GitHub Pages répond
           * `Cache-Control: max-age=600` sur TOUS les fichiers, empreinte ou pas.
           *
           * `pwa-doctor` tient l'invariant depuis le socle 6.8.0
           * (règle `chunk-hors-precache`).
           */
          chunkFileNames: chunk =>
            chunk.name === 'sentry'
              ? 'assets/sentry.js'
              : 'assets/[name]-[hash].js',
          manualChunks(id: string) {
            return id.replace(/\\/g, '/').includes('/@sentry/')
              ? 'sentry'
              : undefined;
          },
        },
      },
    },
    plugins: [
      // AVANT cspPlugin : il pose un script inline dans le <head>, que la
      // CSP doit hacher après coup ; et il écrit version.json au build.
      versionPlugin({ manifest: true }),
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
        logoPath: '/icon-512.png',
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
          /*
           * LE MORCEAU SENTRY HORS DU PRÉCACHE, sans quoi le découpage ne servirait
           * à rien : Workbox ramasse TOUT le JS émis, `import()` ou pas. Mesuré le
           * 16/09/2026 sur la production de deux apps du parc, 345 et 463 KiB de SDK
           * téléchargés par chaque visiteur, sans qu'aucun DSN soit posé.
           *
           * Hors précache, il est cherché sur le réseau à la première erreur, et
           * jamais si l'observabilité reste éteinte : rapporter une erreur demande
           * le réseau.
           */
          globIgnores: ['**/sentry.js', '**/sentry-*.js'],
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
        // Ouvre les hôtes de PostHog — le nuage EUROPÉEN (ADR 0012). Sans
        // cette option, l'ingestion que `ConsentBanner` déclenche APRÈS
        // l'accord serait refusée par la politique — et l'échec ne se verrait
        // qu'en console, sur le site déployé, une fois le consentement donné.
        analytics: true,
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
