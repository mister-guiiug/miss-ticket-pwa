import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { baseTestOptions } from '@mister-guiiug/dev-pwa-config/vitest-base';

export default defineConfig({
  plugins: [react()],
  test: baseTestOptions,
  resolve: {
    alias: {
      // `virtual:pwa-register` n'existe que dans un build servi par
      // vite-plugin-pwa : hors de là, Vite refuse de transformer le module qui
      // l'importe — ici `src/main.tsx` — et le test échoue à la RÉSOLUTION,
      // avant d'avoir rien éprouvé. Le `vi.mock` de `vitest-setup` agit trop
      // tard pour ça : il faut un vrai fichier.
      //
      // Celui du socle est PILOTABLE (`swStub.calls`, `swStub.needRefresh()`),
      // là où les doubles écrits à la main dans douze dépôts sont muets.
      'virtual:pwa-register': fileURLToPath(
        import.meta
          .resolve('@mister-guiiug/dev-pwa-config/testing/pwa-register')
      ),
    },
  },
});
