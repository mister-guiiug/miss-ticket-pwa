import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { SessionState } from '../lib/sessionState';
import type { SessionNotice } from '../lib/sessionNotifications';
import { useSessionNotifications } from './useSessionNotifications';

/**
 * LE CÂBLAGE, C'EST-À-DIRE LE DÉFAUT LUI-MÊME.
 *
 * `sessionNotifications.ts` compare deux relevés, et ses tests le prouvent sur
 * des relevés fabriqués. Mais le défaut d'origine n'était pas là : la
 * comparaison n'existait pas, parce que la référence vers le relevé précédent
 * ne gardait que des IDENTIFIANTS. Un test de fonction pure ne l'aurait jamais
 * attrapé — celui-ci, oui : il donne des relevés SUCCESSIFS, comme Firestore
 * le fait, et regarde ce qui sort.
 */

function session(over: Partial<SessionState> = {}): SessionState {
  return {
    instance_id: 'i-1',
    email: 'a@b.fr',
    concert_url: 'https://example.test/concert',
    status: 'En attente',
    queue_position: '',
    proxy: '',
    effective_ip: '',
    timestamp: 1_000,
    ...over,
  };
}

type Props = Parameters<typeof useSessionNotifications>[0];

/** Le hook branché sur un poste ouvert, avec le carnet de ce qu'il annonce. */
function watch(
  sessions: SessionState[],
  desktopId: string | undefined = 'd-1'
) {
  const onNotice = vi.fn<(notice: SessionNotice) => void>();
  const view = renderHook((props: Props) => useSessionNotifications(props), {
    initialProps: { desktopId, sessions, onNotice },
  });
  const relever = (next: SessionState[], poste = desktopId) =>
    view.rerender({ desktopId: poste, sessions: next, onNotice });
  return { onNotice, relever };
}

describe('prévenir entre deux relevés', () => {
  it('la file franchie part ENFIN', () => {
    // Le cœur du produit : « En attente » → « Page d'achat » doit prévenir.
    // Cette notification n'a jamais pu se déclencher.
    const { onNotice, relever } = watch([session({ status: 'En attente' })]);

    relever([session({ status: "Page d'achat" })]);

    expect(onNotice.mock.calls.map(([n]) => n)).toEqual([
      { kind: 'purchase-reached', email: 'a@b.fr' },
    ]);
  });

  it('l’erreur aussi', () => {
    const { onNotice, relever } = watch([session({ status: 'En attente' })]);

    relever([session({ status: 'Erreur réseau' })]);

    expect(onNotice).toHaveBeenCalledExactlyOnceWith({
      kind: 'error',
      email: 'a@b.fr',
    });
  });

  it('une session inchangée ne déclenche rien', () => {
    const { onNotice, relever } = watch([session({ status: 'En attente' })]);

    relever([session({ status: 'En attente' })]);

    expect(onNotice).not.toHaveBeenCalled();
  });

  it('deux relevés identiques ne notifient pas deux fois', () => {
    // Firestore réémet un instantané sans qu'un seul champ ait bougé : chaque
    // réémission est un nouveau tableau, donc un nouvel effet. La notification
    // ne doit partir qu'au relevé qui porte le changement.
    const { onNotice, relever } = watch([session({ status: 'En attente' })]);

    relever([session({ status: "Page d'achat" })]);
    relever([session({ status: "Page d'achat" })]);
    relever([session({ status: "Page d'achat" })]);

    expect(onNotice).toHaveBeenCalledTimes(1);
  });

  it('annonce la session qui apparaît après le premier relevé', () => {
    const { onNotice, relever } = watch([session({ instance_id: 'i-1' })]);

    relever([
      session({ instance_id: 'i-1' }),
      session({
        instance_id: 'i-2',
        email: 'c@d.fr',
        status: 'En attente',
        queue_position: '2 431',
      }),
    ]);

    expect(onNotice).toHaveBeenCalledExactlyOnceWith({
      kind: 'new-waiting',
      email: 'c@d.fr',
      queuePosition: '2 431',
    });
  });
});

describe('la référence suit le monde, quoi qu’on en conclue', () => {
  it('prend acte d’un relevé VIDE au lieu de rester sur l’ancien', () => {
    // La mise à jour était gardée par `sessions.length > 0` : une liste qui se
    // vidait laissait des identifiants périmés, et la session qui revenait
    // passait pour déjà connue — donc muette à jamais.
    const { onNotice, relever } = watch([session({ status: 'En attente' })]);

    relever([]);
    relever([session({ status: 'En attente' })]);

    expect(onNotice).toHaveBeenCalledExactlyOnceWith({
      kind: 'new-waiting',
      email: 'a@b.fr',
      queuePosition: '',
    });
  });

  it('se tait en changeant de poste, mais repart du bon relevé', () => {
    const { onNotice, relever } = watch([session({ status: 'En attente' })]);

    // Le poste B : ses sessions ne sont pas « nouvelles », l'écran a changé.
    relever([session({ instance_id: 'i-9', status: 'En attente' })], 'd-2');
    expect(onNotice).not.toHaveBeenCalled();

    // Mais le relevé du poste B est bien devenu la référence : le
    // franchissement qui suit, lui, est annoncé.
    relever([session({ instance_id: 'i-9', status: "Page d'achat" })], 'd-2');
    expect(onNotice).toHaveBeenCalledExactlyOnceWith({
      kind: 'purchase-reached',
      email: 'a@b.fr',
    });
  });

  it('ne dit rien au tout premier relevé', () => {
    const { onNotice } = watch([session({ status: "Page d'achat" })]);

    expect(onNotice).not.toHaveBeenCalled();
  });
});
