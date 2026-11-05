import { describe, expect, it, vi } from 'vitest';

/**
 * LA SESSION DOIT SURVIVRE À UN RECHARGEMENT.
 *
 * `initializeAuth(app, { persistence: undefined })` la gardait en MÉMOIRE —
 * le commentaire disait « la PWA gère sa propre persistance », rien ne la
 * gérait. Relevé le 05/11/2026 : chaque rechargement ramenait à l'écran de
 * connexion, et `signInWithPseudo` ouvrait un NOUVEL uid anonyme. Or
 * `useDesktops` filtre `where('userId', '==', uid)` : les postes appariés
 * disparaissaient, même en ligne.
 *
 * Firebase est doublé : on éprouve le BRANCHEMENT, pas le SDK. Ce qui compte
 * est la persistance donnée à `initializeAuth`, et son ordre — IndexedDB
 * d'abord, `localStorage` en repli quand IndexedDB est refusé.
 */
const { initializeAuth } = vi.hoisted(() => ({
  initializeAuth: vi.fn((...args: unknown[]) => {
    void args;
    return { type: 'auth-mock' };
  }),
}));

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ type: 'app-mock' })),
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({ type: 'db-mock' })),
}));
vi.mock('firebase/auth', () => ({
  initializeAuth,
  indexedDBLocalPersistence: { type: 'LOCAL', nom: 'indexedDB' },
  browserLocalPersistence: { type: 'LOCAL', nom: 'localStorage' },
}));

describe('config Firebase : session Auth', () => {
  it('la session est gardée sur l’appareil, IndexedDB d’abord', async () => {
    // Une configuration complète : sans elle, le module journalise une erreur
    // à l'import (il ne lève qu'en production).
    for (const cle of [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
      'VITE_FIREBASE_APP_ID',
    ]) {
      vi.stubEnv(cle, 'test');
    }
    // Importé DANS le test : le compte d'appels d'un double est remis à zéro
    // avant chaque test, et l'appel à vérifier a lieu à l'import du module.
    const { app } = await import('./firebase');
    const { indexedDBLocalPersistence, browserLocalPersistence } =
      await import('firebase/auth');

    expect(initializeAuth).toHaveBeenCalledTimes(1);
    expect(initializeAuth).toHaveBeenCalledWith(app, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence],
    });
  });
});
