import { describe, expect, it } from 'vitest';
import type { SessionState } from './sessionState';
import {
  diffSessionNotices,
  type SessionSnapshot,
} from './sessionNotifications';

/**
 * LA NOTIFICATION QUI N'EST JAMAIS PARTIE.
 *
 * Miss Ticket promet de surveiller une file d'attente et de prévenir quand
 * elle est franchie. C'est LE service rendu — et il ne fonctionnait pas :
 * l'état « d'avant » d'une session était relu dans le relevé COURANT, donc
 * comparé à lui-même. « Page d'achat atteinte » et « Erreur de session » ne
 * pouvaient pas se déclencher.
 *
 * Ce fichier éprouve la comparaison elle-même. Le câblage — garder le relevé
 * précédent, et le garder JUSTE — est éprouvé par
 * `hooks/useSessionNotifications.test.tsx`.
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

function snapshot(sessions: SessionState[]): SessionSnapshot {
  return { desktopId: 'd-1', sessions };
}

describe('prévenir d’un franchissement', () => {
  it('annonce la page d’achat atteinte — la promesse du produit', () => {
    const notices = diffSessionNotices(
      snapshot([session({ status: 'En attente' })]),
      snapshot([session({ status: "Page d'achat" })])
    );

    expect(notices).toEqual([{ kind: 'purchase-reached', email: 'a@b.fr' }]);
  });

  it('annonce l’erreur, « échec » compris', () => {
    // `échec` était ignoré ici alors que le filtre du panneau et l'issue
    // archivée le comptent comme une erreur : la session s'archivait en
    // `error` sans que personne n'ait été prévenu.
    expect(
      diffSessionNotices(
        snapshot([session({ status: 'Connecté' })]),
        snapshot([session({ status: 'Erreur réseau' })])
      )
    ).toEqual([{ kind: 'error', email: 'a@b.fr' }]);

    expect(
      diffSessionNotices(
        snapshot([session({ status: 'Connecté' })]),
        snapshot([session({ status: 'Échec du paiement' })])
      )
    ).toEqual([{ kind: 'error', email: 'a@b.fr' }]);
  });

  it('ne dit rien d’une session inchangée', () => {
    expect(
      diffSessionNotices(
        snapshot([session({ status: 'En attente' })]),
        snapshot([session({ status: 'En attente' })])
      )
    ).toEqual([]);
  });

  it('ne dit rien d’un changement qui ne franchit aucun seuil', () => {
    // La position dans la file avance, le statut change de libellé : c'est le
    // quotidien d'une session, pas un événement.
    expect(
      diffSessionNotices(
        snapshot([session({ status: 'Connexion' })]),
        snapshot([session({ status: 'Connecté' })])
      )
    ).toEqual([]);
  });

  it('n’annonce qu’une fois un seuil déjà franchi', () => {
    // Deux libellés d'achat successifs : la file n'est franchie qu'une fois.
    expect(
      diffSessionNotices(
        snapshot([session({ status: "Page d'achat" })]),
        snapshot([session({ status: "Page d'achat (panier)" })])
      )
    ).toEqual([]);
    // Idem pour deux erreurs successives.
    expect(
      diffSessionNotices(
        snapshot([session({ status: 'Erreur réseau' })]),
        snapshot([session({ status: 'Erreur proxy' })])
      )
    ).toEqual([]);
  });

  it('sépare les sessions : chacune est comparée à la sienne', () => {
    const notices = diffSessionNotices(
      snapshot([
        session({ instance_id: 'i-1', status: 'En attente' }),
        session({ instance_id: 'i-2', status: 'En attente', email: 'c@d.fr' }),
      ]),
      snapshot([
        session({ instance_id: 'i-1', status: 'En attente' }),
        session({
          instance_id: 'i-2',
          status: "Page d'achat",
          email: 'c@d.fr',
        }),
      ])
    );

    expect(notices).toEqual([{ kind: 'purchase-reached', email: 'c@d.fr' }]);
  });
});

describe('annoncer une session nouvelle', () => {
  it('annonce celle qui entre dans la file, avec sa position', () => {
    const notices = diffSessionNotices(
      snapshot([]),
      snapshot([session({ status: 'En attente', queue_position: '2 431' })])
    );

    expect(notices).toEqual([
      { kind: 'new-waiting', email: 'a@b.fr', queuePosition: '2 431' },
    ]);
  });

  it('annonce celle qui naît déjà sur la page d’achat, avec son URL', () => {
    const notices = diffSessionNotices(
      snapshot([]),
      snapshot([session({ status: "Page d'achat" })])
    );

    expect(notices).toEqual([
      {
        kind: 'new-purchase',
        email: 'a@b.fr',
        concertUrl: 'https://example.test/concert',
      },
    ]);
  });

  it('se tait sur une session qui ne fait que se connecter', () => {
    expect(
      diffSessionNotices(
        snapshot([]),
        snapshot([session({ status: 'Connecté' })])
      )
    ).toEqual([]);
  });
});

describe('les abstentions', () => {
  it('ne conclut rien au tout premier relevé', () => {
    // Sinon, ouvrir l'écran d'un poste annoncerait comme « nouvelle » chaque
    // session qui y tournait déjà depuis une heure.
    expect(
      diffSessionNotices(null, snapshot([session({ status: 'En attente' })]))
    ).toEqual([]);
  });

  it('ne conclut rien quand on change de poste', () => {
    // Les sessions du poste B ne sont pas « nouvelles » : c'est l'écran qui a
    // changé. Sans cette garde, l'aller-retour vers la liste des postes
    // renotifierait tout à chaque passage.
    expect(
      diffSessionNotices(
        { desktopId: 'd-1', sessions: [session({ instance_id: 'i-1' })] },
        { desktopId: 'd-2', sessions: [session({ instance_id: 'i-9' })] }
      )
    ).toEqual([]);
  });

  it('ne conclut rien quand aucun écran de poste n’est ouvert', () => {
    expect(
      diffSessionNotices(snapshot([session()]), {
        desktopId: undefined,
        sessions: [session({ status: "Page d'achat" })],
      })
    ).toEqual([]);
  });

  it('ne dit rien d’une session qui a disparu — c’est l’affaire de l’historique', () => {
    expect(diffSessionNotices(snapshot([session()]), snapshot([]))).toEqual([]);
  });
});
