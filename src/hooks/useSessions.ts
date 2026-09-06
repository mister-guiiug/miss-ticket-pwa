import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  type DocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { toSessionState, type SessionState } from '../lib/sessionState';
import { createLogger } from '@mister-guiiug/dev-pwa-config/logger';

const log = createLogger('hooks');

/**
 * UN RELEVÉ QUI N'EST PAS ARRIVÉ N'EST PAS UN RELEVÉ VIDE.
 *
 * Le hook gardait `sessions` et `loading` côte à côte, et RIEN ne relevait
 * `loading` en changeant de poste : entre le clic sur un poste et la réponse de
 * Firestore, il annonçait « chargé, aucune session » — un état qui n'a jamais
 * existé. L'écran montrait « Aucune session » l'espace d'un instant, et surtout
 * ce faux relevé devenait le point de comparaison des notifications : les
 * sessions déjà en cours arrivaient ensuite comme NOUVELLES, à chaque ouverture
 * d'un poste. C'est exactement le tapage que les abstentions de
 * `sessionNotifications.ts` étaient censées empêcher.
 *
 * Le relevé porte donc le poste dont il parle, et `loading` s'en déduit au
 * rendu. Ce n'est plus un drapeau qu'il faut penser à lever : tant que ce qu'on
 * tient ne concerne pas le poste demandé, il n'est pas arrivé.
 */
interface ReceivedSessions {
  desktopId: string;
  sessions: SessionState[];
}

/** Partagé : « aucune session » garde ainsi la même identité d'un rendu à l'autre. */
const NO_SESSIONS: SessionState[] = [];

export function useSessions(desktopId: string | undefined) {
  const [received, setReceived] = useState<ReceivedSessions | null>(null);

  useEffect(() => {
    // Aucun poste ouvert : rien à écouter, et rien à attendre.
    if (!desktopId) return;

    const q = query(
      collection(db, 'sessions'),
      where('desktopId', '==', desktopId)
    );

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const sessionsData: SessionState[] = [];
        snapshot.forEach((doc: DocumentSnapshot<DocumentData>) => {
          const data = doc.data();
          if (data) {
            // Même normalisation que pour les sessions embarquées dans le
            // document d'un poste : une seule définition de « ce qu'est une
            // session », et l'identifiant vient ici du document.
            sessionsData.push(toSessionState(data, doc.id));
          }
        });
        setReceived({ desktopId, sessions: sessionsData });
      },
      error => {
        log.error('Error listening to sessions:', { error: error });
        // Une coupure passagère n'efface pas un relevé déjà reçu : ce serait
        // faire disparaître des sessions bien vivantes. On ne fait que lever
        // l'attente, et seulement si l'on n'a encore rien reçu de ce poste.
        setReceived(previous =>
          previous?.desktopId === desktopId
            ? previous
            : { desktopId, sessions: [] }
        );
      }
    );

    return unsubscribe;
  }, [desktopId]);

  const arrived =
    received !== null && received.desktopId === desktopId
      ? received.sessions
      : null;

  return {
    sessions: arrived ?? NO_SESSIONS,
    loading: !!desktopId && arrived === null,
  };
}
