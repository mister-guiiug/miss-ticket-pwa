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
import { createLogger } from '@mister-guiiug/dev-pwa-config/logger';
import { toSessionStates, type SessionState } from '../lib/sessionState';

const log = createLogger('hooks');

export interface Desktop {
  id: string;
  name: string;
  online: boolean;
  lastSeen: Date;
  sessions: SessionState[];
}

export function useDesktops(userId: string | undefined) {
  const [desktops, setDesktops] = useState<Desktop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setDesktops([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'desktops'), where('userId', '==', userId));

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const desktopsData: Desktop[] = [];
        snapshot.forEach((doc: DocumentSnapshot<DocumentData>) => {
          const data = doc.data();
          if (data) {
            desktopsData.push({
              id: doc.id,
              name: data.name || 'Desktop',
              online: data.online || false,
              lastSeen: data.lastSeen?.toDate() || new Date(),
              sessions: toSessionStates(data.sessions),
            });
          }
        });
        setDesktops(desktopsData);
        setLoading(false);
      },
      error => {
        log.error('Error listening to desktops:', { error: error });
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [userId]);

  return { desktops, loading };
}
