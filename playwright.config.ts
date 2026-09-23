import { defineConfig, devices } from '@playwright/test';
import { definePwaPlaywrightConfig } from '@mister-guiiug/dev-pwa-config/playwright-base';

// Factory famille : matrice navigateurs, reporters, snapshots, reducedMotion.
// `preview: true` (dev-pwa-config 3.x) : les e2e testent un BUILD de prod.
// Port 4173 pour éviter les collisions.
//
// LA BASE EST CELLE DE LA PRODUCTION, `/miss-ticket-pwa/`, et c'est voulu.
// C'est le défaut de `vite.config.ts` depuis le 06/09/2026 (#26). `vite preview`
// sert donc sous `/miss-ticket-pwa/` et redirige `/` vers cette base (302) :
// `page.goto('/')` y arrive, les assets répondent 200.
//
// NE PAS poser `VITE_BASE_PATH=/` comme le font d'autres apps du parc : ici,
// `public/manifest.json` est écrit à la main en `/miss-ticket-pwa/…`. Mesuré le
// 24/09/2026 sur un build à la racine : chaque icône et capture du manifeste
// répond 200 en `text/html`, le repli SPA de `vite preview`. Le build testé
// aurait un manifeste cassé, en silence.
//
// Joué en CI par `run-e2e: true` (ci.yml, depuis le 19/09/2026) ;
// en local : `npm run test:e2e`.
export default defineConfig(
  definePwaPlaywrightConfig({
    devices,
    testMatch: /.*\.spec\.ts$/,
    preview: true,
    port: 4173,
    command: 'npm run build && vite preview --port 4173 --strictPort',
  })
);
