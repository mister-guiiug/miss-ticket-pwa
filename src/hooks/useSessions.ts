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
 *
 * ET CE QU'ON TIENT APPARTIENT À UN ABONNEMENT, PAS À UN POSTE. Quitter un
 * poste puis y revenir en ouvre un NOUVEAU : le relevé de la visite précédente
 * — ou l'échec précédent, car une erreur Firestore ferme définitivement
 * l'écoute — n'est pas le relevé de celle-ci. Le garder rendrait `loading` faux
 * dès le premier rendu, et le relevé périmé redeviendrait le point de
 * comparaison des notifications : tout ce qui a changé entre deux visites
 * partirait comme NOUVEAU. On l'oublie donc pendant le rendu, pour que
 * l'attente soit vraie dès CE rendu-là et pas seulement après le premier effet.
 */
interface ReceivedSessions {
  desktopId: string;
  sessions: SessionState[];
}

/** Partagé : « aucune session » garde ainsi la même identité d'un rendu à l'autre. */
const NO_SESSIONS: SessionState[] = [];

export function useSessions(desktopId: string | undefined) {
  const [received, setReceived] = useState<ReceivedSessions | null>(null);
  const [listenedTo, setListenedTo] = useState(desktopId);

  // Le motif « ajuster un état quand une prop change » : React relance le rendu
  // avec l'état neuf avant de rien peindre. Un effet arriverait trop tard —
  // l'effet des notifications s'exécute dans la MÊME passe, avec le relevé
  // périmé encore en main.
  if (listenedTo !== desktopId) {
    setListenedTo(desktopId);
    setReceived(null);
  }

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
        // l'attente, et seulement si rien n'était encore arrivé. L'écoute, elle,
        // est morte : Firestore ne rappellera plus. C'est la visite suivante qui
        // rouvre un abonnement — et qui, grâce à l'oubli ci-dessus, repart d'une
        // attente et non de ce vide-là.
        setReceived(previous =>
          previous?.desktopId === desktopId
            ? previous
            : { desktopId, sessions: [] }
        );
      }
    );

    return unsubscribe;
  }, [desktopId]);

  // Le poste est revérifié ici, alors que l'oubli au rendu le garantit déjà :
  // c'est la ceinture qui va avec les bretelles, contre un instantané qui
  // arriverait d'un abonnement qu'on croyait fermé.
  const arrived =
    received !== null && received.desktopId === desktopId
      ? received.sessions
      : null;

  return {
    sessions: arrived ?? NO_SESSIONS,
    loading: !!desktopId && arrived === null,
  };
}
