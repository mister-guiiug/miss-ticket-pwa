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

export function useSessions(desktopId: string | undefined) {
  const [sessions, setSessions] = useState<SessionState[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!desktopId) {
      setSessions([]);
      setLoading(false);
      return;
    }

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
        setSessions(sessionsData);
        setLoading(false);
      },
      error => {
        log.error('Error listening to sessions:', { error: error });
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [desktopId]);

  return { sessions, loading };
}
