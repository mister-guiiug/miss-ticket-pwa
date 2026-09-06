import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

/**
 * « CHARGÉ, AUCUNE SESSION » — UN ÉTAT QUI N'A JAMAIS EXISTÉ.
 *
 * `loading` naissait à `true` et n'était jamais relevé : dès le second poste
 * ouvert, le hook annonçait « chargé » en tenant la liste vide du poste
 * précédent. L'écran clignotait sur « Aucune session », et ce faux relevé
 * servait de point de comparaison aux notifications — d'où des sessions déjà
 * en cours annoncées comme nouvelles à chaque ouverture d'un poste.
 *
 * Ce fichier fige la seule chose que le hook doit promettre : ce qu'il rend
 * concerne le poste demandé, ou il dit qu'il attend.
 */

interface FakeDoc {
  id: string;
  data: () => Record<string, unknown>;
}

interface FakeSnapshot {
  forEach: (visit: (doc: FakeDoc) => void) => void;
}

interface Listener {
  desktopId: string;
  next: (snapshot: FakeSnapshot) => void;
  fail: (error: Error) => void;
}

const listeners: Listener[] = [];
const unsubscribed: string[] = [];

vi.mock('../config/firebase', () => ({ db: {} }));

// Le double réduit la requête à ce qui l'identifie : le poste écouté. Il évite
// surtout d'initialiser Firebase, que ce hook n'a pas à prouver ici.
vi.mock('firebase/firestore', () => ({
  collection: () => 'sessions',
  where: (_field: string, _op: string, value: string) => value,
  query: (_collection: unknown, desktopId: string) => desktopId,
  onSnapshot: (
    desktopId: string,
    next: (snapshot: FakeSnapshot) => void,
    fail: (error: Error) => void
  ) => {
    listeners.push({ desktopId, next, fail });
    return () => {
      unsubscribed.push(desktopId);
    };
  },
}));

const { useSessions } = await import('./useSessions');

function listenerOf(desktopId: string): Listener {
  const found = [...listeners].reverse().find(l => l.desktopId === desktopId);
  if (!found) throw new Error(`aucun abonnement pour ${desktopId}`);
  return found;
}

/** Firestore répond, pour ce poste. */
function repondre(
  desktopId: string,
  sessions: { id: string; status: string }[]
) {
  act(() => {
    listenerOf(desktopId).next({
      forEach: visit => {
        for (const s of sessions) {
          visit({
            id: s.id,
            data: () => ({ email: 'a@b.fr', status: s.status }),
          });
        }
      },
    });
  });
}

beforeEach(() => {
  listeners.length = 0;
  unsubscribed.length = 0;
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('ce qu’on tient, et de quel poste il parle', () => {
  it('attend tant que le relevé du poste demandé n’est pas arrivé', () => {
    const { result } = renderHook(() => useSessions('d-1'));

    expect(result.current.loading).toBe(true);
    expect(result.current.sessions).toEqual([]);

    repondre('d-1', [{ id: 'i-1', status: 'En attente' }]);

    expect(result.current.loading).toBe(false);
    expect(result.current.sessions.map(s => s.instance_id)).toEqual(['i-1']);
  });

  it('en CHANGEANT de poste, il attend au lieu de dire « aucune session »', () => {
    // Le défaut : `loading` restait à `false` et la liste vide du poste
    // précédent passait pour le relevé du nouveau.
    const { result, rerender } = renderHook(
      ({ id }: { id: string }) => useSessions(id),
      { initialProps: { id: 'd-1' } }
    );
    repondre('d-1', [{ id: 'i-1', status: 'En attente' }]);
    expect(result.current.loading).toBe(false);

    rerender({ id: 'd-2' });

    expect(result.current.loading).toBe(true);
    // Et surtout : pas les sessions de d-1.
    expect(result.current.sessions).toEqual([]);

    repondre('d-2', [{ id: 'i-9', status: 'En attente' }]);

    expect(result.current.loading).toBe(false);
    expect(result.current.sessions.map(s => s.instance_id)).toEqual(['i-9']);
  });

  it('en REVENANT sur un poste, il attend le nouvel abonnement', () => {
    // Ce qu'on tient appartient à un abonnement, pas à un poste. Le relevé de
    // la visite précédente peut avoir des minutes : le servir comme s'il était
    // frais ferait passer pour NOUVEAU tout ce qui a changé entre-temps.
    const { result, rerender } = renderHook(
      ({ id }: { id: string | undefined }) => useSessions(id),
      { initialProps: { id: 'd-1' as string | undefined } }
    );
    repondre('d-1', [{ id: 'i-1', status: 'En attente' }]);

    rerender({ id: undefined }); // retour à la liste des postes
    rerender({ id: 'd-1' }); // et on rouvre le même poste

    expect(result.current.loading).toBe(true);
    expect(result.current.sessions).toEqual([]);
  });

  it('après un ÉCHEC, revenir sur le poste repart d’une attente', () => {
    // Une erreur Firestore ferme l'écoute pour de bon. Sans l'oubli au rendu,
    // le vide qu'elle laisse serait resservi à la visite suivante comme un
    // relevé — et les sessions bien vivantes du poste arriveraient toutes
    // comme nouvelles.
    const { result, rerender } = renderHook(
      ({ id }: { id: string | undefined }) => useSessions(id),
      { initialProps: { id: 'd-1' as string | undefined } }
    );
    act(() => listenerOf('d-1').fail(new Error('permission-denied')));
    expect(result.current.loading).toBe(false);

    rerender({ id: undefined });
    rerender({ id: 'd-1' });

    expect(result.current.loading).toBe(true);
  });

  it('ferme l’abonnement du poste qu’on quitte', () => {
    const { rerender } = renderHook(
      ({ id }: { id: string }) => useSessions(id),
      {
        initialProps: { id: 'd-1' },
      }
    );

    rerender({ id: 'd-2' });

    expect(unsubscribed).toEqual(['d-1']);
  });

  it('sans poste ouvert, il n’y a rien à attendre', () => {
    const { result } = renderHook(() => useSessions(undefined));

    expect(result.current.loading).toBe(false);
    expect(result.current.sessions).toEqual([]);
    expect(listeners).toEqual([]);
  });

  it('garde la même liste vide d’un rendu à l’autre', () => {
    // Une identité stable : sinon chaque rendu passerait pour un relevé neuf
    // auprès de qui compare deux relevés successifs.
    const { result, rerender } = renderHook(() => useSessions(undefined));
    const first = result.current.sessions;

    rerender();

    expect(result.current.sessions).toBe(first);
  });
});

describe('quand Firestore tombe', () => {
  it('lève l’attente s’il n’était encore rien arrivé', () => {
    const { result } = renderHook(() => useSessions('d-1'));

    act(() => listenerOf('d-1').fail(new Error('permission-denied')));

    expect(result.current.loading).toBe(false);
    expect(result.current.sessions).toEqual([]);
  });

  it('n’efface pas un relevé déjà reçu', () => {
    // Une coupure passagère ferait sinon disparaître des sessions bien
    // vivantes — et l'historique les archiverait comme terminées.
    const { result } = renderHook(() => useSessions('d-1'));
    repondre('d-1', [{ id: 'i-1', status: 'En attente' }]);

    act(() => listenerOf('d-1').fail(new Error('unavailable')));

    expect(result.current.sessions.map(s => s.instance_id)).toEqual(['i-1']);
    expect(result.current.loading).toBe(false);
  });
});
