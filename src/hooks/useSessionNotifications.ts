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
 * Elle est donc réécrite À CHAQUE RELEVÉ, quelle qu'en soit la conclusion —
 * y compris quand la comparaison s'abstient. Un relevé sur lequel on refuse de
 * conclure reste le point de départ du suivant.
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
  /** Appelé une fois par événement constaté. */
  onNotice: (notice: SessionNotice) => void;
}

export function useSessionNotifications({
  desktopId,
  sessions,
  onNotice,
}: UseSessionNotificationsOptions): void {
  const previousRef = useRef<SessionSnapshot | null>(null);

  useEffect(() => {
    const previous = previousRef.current;
    const current: SessionSnapshot = { desktopId, sessions };
    previousRef.current = current;

    for (const notice of diffSessionNotices(previous, current)) {
      onNotice(notice);
    }
  }, [desktopId, sessions, onNotice]);
}
