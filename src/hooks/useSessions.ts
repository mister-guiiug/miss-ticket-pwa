import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  DocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { SessionState } from './useDesktops';

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
            sessionsData.push({
              instance_id: doc.id,
              email: data.email || '',
              concert_url: data.concert_url || '',
              status: data.status || 'Inconnu',
              queue_position: data.queue_position || '',
              proxy: data.proxy || '',
              effective_ip: data.effective_ip || '',
              timestamp: data.timestamp || Date.now(),
            });
          }
        });
        setSessions(sessionsData);
        setLoading(false);
      },
      error => {
        console.error('Error listening to sessions:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [desktopId]);

  return { sessions, loading };
}
