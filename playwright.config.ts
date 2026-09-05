import { defineConfig, devices } from '@playwright/test';
import { definePwaPlaywrightConfig } from '@mister-guiiug/dev-pwa-config/playwright-base';

// Factory famille : matrice navigateurs, reporters, snapshots, reducedMotion.
// `preview: true` (dev-pwa-config 3.x) : les e2e testent un BUILD de prod.
// La base est '/' par défaut ici (use-base-path: false au deploy), donc pas
// besoin de neutraliser VITE_BASE_PATH. Port 4173 pour éviter les collisions.
// Non exécuté en CI (run-e2e: false) — local : `npm run test:e2e`.
export default defineConfig(
  definePwaPlaywrightConfig({
    devices,
    testMatch: /.*\.spec\.ts$/,
    preview: true,
    port: 4173,
    command: 'npm run build && vite preview --port 4173 --strictPort',
  })
);
