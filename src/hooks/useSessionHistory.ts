import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Desktop } from './useDesktops';
import type { SessionState } from '../lib/sessionState';
import {
  clearHistory,
  diffEndedSessions,
  loadHistory,
  recordEnded,
  type ObservedDesktop,
  type SessionHistoryEntry,
} from '../lib/sessionHistory';

/**
 * L'ŒIL QUI CONSTATE LES FINS.
 *
 * Firestore ne notifie pas « cette session est terminée » : il notifie un
 * nouvel état du monde. Une session terminée est donc une session qui n'est
 * PLUS LÀ — et cette absence n'existe qu'entre deux relevés. Personne ne la
 * regardait : l'app n'affichait que l'instantané courant, si bien qu'une
 * session disparue ne laissait aucune trace, alors que son issue est ce que
 * l'utilisateur venait chercher.
 *
 * DEUX SOURCES, UNE SEULE COMPARAISON HONNÊTE. Les sessions arrivent par deux
 * canaux : celles embarquées dans le document de chaque poste (`useDesktops`,
 * abonné en permanence) et celles de la collection `sessions` du poste OUVERT
 * (`useSessions`, abonné seulement quand on en ouvre un). Le poste ouvert est
 * donc observé plus finement que les autres. C'est ce que porte la `scope` de
 * chaque relevé : `diffEndedSessions` refuse de conclure quand elle change,
 * parce que passer de l'écran d'un poste à la liste fait « disparaître » des
 * sessions bien vivantes. Sans cette abstention, naviguer remplirait
 * l'historique de fins imaginaires.
 *
 * CE QUE CE HOOK NE SAIT PAS FAIRE, ET NE PRÉTEND PAS : voir une fin pendant
 * que l'app est fermée. Il n'y a pas de notification poussée (chantier écarté
 * ici) ; l'historique dit « ce que cette télécommande a vu », et rien d'autre.
 */

interface UseSessionHistoryOptions {
  /** Tous les postes appariés, avec leurs sessions embarquées. */
  desktops: Desktop[];
  /** Le poste dont l'écran est ouvert, s'il y en a un. */
  openDesktopId: string | undefined;
  /** Les sessions de la collection, pour ce poste ouvert. */
  openSessions: SessionState[];
}

export interface UseSessionHistory {
  /** L'historique, du plus récemment terminé au plus ancien. */
  history: SessionHistoryEntry[];
  /** À appeler quand l'utilisateur DEMANDE l'arrêt de sessions. */
  markStopRequested: (instanceIds: readonly string[]) => void;
  /** Efface l'historique et ses copies de côté. */
  clear: () => void;
}

/**
 * Les deux canaux d'un même poste, réunis. L'union — et non l'intersection :
 * une session vue par l'un des deux canaux est VIVANTE. Prendre
 * l'intersection archiverait à chaque décalage de propagation entre le
 * document du poste et la collection.
 */
function mergeSessions(
  embedded: readonly SessionState[],
  collection: readonly SessionState[]
): SessionState[] {
  const merged = new Map<string, SessionState>();
  for (const session of embedded) merged.set(session.instance_id, session);
  // La collection est plus fraîche (un document par session, écrit à chaque
  // changement) : à identifiant égal, c'est elle qui décrit l'état.
  for (const session of collection) merged.set(session.instance_id, session);
  return [...merged.values()];
}

export function useSessionHistory({
  desktops,
  openDesktopId,
  openSessions,
}: UseSessionHistoryOptions): UseSessionHistory {
  const [history, setHistory] = useState<SessionHistoryEntry[]>(loadHistory);
  const previousRef = useRef<ObservedDesktop[] | null>(null);
  const stopRequestedRef = useRef<Set<string>>(new Set());

  const observed = useMemo<ObservedDesktop[]>(
    () =>
      desktops.map(desktop =>
        desktop.id === openDesktopId
          ? {
              id: desktop.id,
              name: desktop.name,
              scope: 'detail',
              sessions: mergeSessions(desktop.sessions ?? [], openSessions),
            }
          : {
              id: desktop.id,
              name: desktop.name,
              scope: 'list',
              sessions: desktop.sessions ?? [],
            }
      ),
    [desktops, openDesktopId, openSessions]
  );

  useEffect(() => {
    const previous = previousRef.current;
    previousRef.current = observed;
    // Le tout PREMIER relevé n'a rien à comparer : sans cette garde, ouvrir
    // l'app archiverait le monde entier comme « terminé ».
    if (previous === null) return;

    const ended = diffEndedSessions(
      previous,
      observed,
      Date.now(),
      stopRequestedRef.current
    );
    if (ended.length === 0) return;

    // L'intention consommée : un identifiant réutilisé plus tard ne doit pas
    // hériter d'un « arrêt demandé » qui n'est plus le sien.
    for (const entry of ended)
      stopRequestedRef.current.delete(entry.instanceId);
    setHistory(recordEnded(ended));
  }, [observed]);

  const markStopRequested = useCallback((instanceIds: readonly string[]) => {
    for (const id of instanceIds) stopRequestedRef.current.add(id);
  }, []);

  const clear = useCallback(() => {
    clearHistory();
    setHistory([]);
  }, []);

  return { history, markStopRequested, clear };
}
