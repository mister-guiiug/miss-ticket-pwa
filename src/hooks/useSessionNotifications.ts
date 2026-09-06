import { useEffect, useRef } from 'react';
import type { SessionState } from '../lib/sessionState';
import {
  diffSessionNotices,
  type SessionNotice,
  type SessionSnapshot,
} from '../lib/sessionNotifications';

/**
 * LA MÉMOIRE D'UN RELEVÉ À L'AUTRE.
 *
 * `sessionNotifications.ts` sait dire ce qui a changé entre deux relevés ; ce
 * hook est la pièce qui les lui donne — c'est-à-dire l'endroit exact où le
 * défaut vivait. La référence ne gardait que des identifiants, si bien qu'il
 * n'y avait RIEN à comparer, et elle n'était mise à jour que sous
 * `sessions.length > 0` : une liste qui se vidait la laissait périmée, et la
 * session qui revenait passait pour déjà connue.
 *
 * Elle est donc réécrite À CHAQUE RELEVÉ REÇU, quelle qu'en soit la conclusion
 * — y compris quand la comparaison s'abstient. Un relevé sur lequel on refuse
 * de conclure reste le point de départ du suivant. « Reçu » n'est pas un détail :
 * la liste vide que `useSessions` tient avant la réponse de Firestore n'est pas
 * un relevé de ce poste, et la retenir suffirait à faire passer pour nouvelles
 * toutes les sessions déjà en cours.
 *
 * `onNotice` figure dans les dépendances de l'effet, sans détour par une
 * référence : `App` le reconstruit quand la langue change, et un tour de plus
 * ne coûte rien puisque le relevé, lui, n'a pas bougé — c'est ce que fige le
 * test « deux relevés identiques ne notifient pas deux fois ».
 */
export interface UseSessionNotificationsOptions {
  /** Le poste dont l'écran est ouvert, s'il y en a un. */
  desktopId: string | undefined;
  /** Les sessions de ce poste, au relevé courant. */
  sessions: SessionState[];
  /** `true` tant que le relevé de ce poste n'est pas arrivé. */
  loading: boolean;
  /** Appelé une fois par événement constaté. */
  onNotice: (notice: SessionNotice) => void;
}

export function useSessionNotifications({
  desktopId,
  sessions,
  loading,
  onNotice,
}: UseSessionNotificationsOptions): void {
  const previousRef = useRef<SessionSnapshot | null>(null);

  useEffect(() => {
    // CE QUI N'EST PAS ARRIVÉ NE SE COMPARE PAS, ET NE SE RETIENT PAS. La liste
    // vide qui précède la réponse de Firestore n'est pas un relevé du poste :
    // la retenir en ferait la référence, et les sessions déjà en cours
    // arriveraient ensuite comme NOUVELLES — à chaque ouverture d'un poste.
    // L'abstention du changement de poste, elle, doit rester valable jusqu'au
    // premier VRAI relevé.
    if (loading) return;

    const previous = previousRef.current;
    const current: SessionSnapshot = { desktopId, sessions };
    previousRef.current = current;

    for (const notice of diffSessionNotices(previous, current)) {
      onNotice(notice);
    }
  }, [desktopId, sessions, loading, onNotice]);
}
