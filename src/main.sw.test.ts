import { beforeEach, describe, expect, it, vi } from 'vitest';
import { swStub } from '@mister-guiiug/dev-pwa-config/testing/pwa-register';

/**
 * CE QUE CE FICHIER TIENT. `src/register-sw.ts` n'était couvert par aucun test,
 * et son unique branche observable — la désinscription de DÉVELOPPEMENT — est
 * précisément celle qui échoue en silence : un worker resté d'une session
 * précédente sert du cache périmé pendant le HMR, et rien ne le signale sinon
 * un comportement inexplicable pendant qu'on code.
 *
 * Vitest pose `import.meta.env.DEV` à vrai : c'est donc la branche de
 * développement que `main.tsx` emprunte ici, et la seule qu'un test puisse
 * atteindre. L'autre — `registerSW({ immediate: true })` — est éprouvée par sa
 * NÉGATION : on vérifie que rien n'est enregistré, sur le double pilotable qui
 * saurait le dire.
 *
 * `App` et la configuration Firebase sont doublés : ce qu'on monte est le
 * démarrage de l'app, pas son écran. `main.tsx` ne rend d'ailleurs rien ici,
 * `document.getElementById('app')` étant nul dans un document jsdom vierge.
 */

// Le setup partagé du socle pose un `vi.mock('virtual:pwa-register')` muet ; on
// lui rend la main au profit du double pilotable désigné par le `resolve.alias`
// de `vitest.config.ts`.
vi.unmock('virtual:pwa-register');

vi.mock('./App', () => ({ default: () => null }));
vi.mock('./config/firebase', () => ({
  app: {},
  auth: {},
  db: {},
}));

const unregister = vi.fn(() => Promise.resolve(true));

describe('démarrage : service worker', () => {
  beforeEach(() => {
    vi.resetModules();
    swStub.reset();
    unregister.mockClear();
    Object.defineProperty(globalThis.navigator, 'serviceWorker', {
      configurable: true,
      value: {
        getRegistrations: () => Promise.resolve([{ unregister }]),
        addEventListener: () => {},
        removeEventListener: () => {},
      },
    });
  });

  it('en développement : rien n’est enregistré, et les workers résiduels tombent', async () => {
    await import('./main');
    // La désinscription est asynchrone et volontairement non attendue par le
    // démarrage (`void`) : on laisse la micro-tâche se vider.
    await Promise.resolve();
    await Promise.resolve();

    expect(swStub.calls).toBe(0);
    expect(unregister).toHaveBeenCalledTimes(1);
  });
});
