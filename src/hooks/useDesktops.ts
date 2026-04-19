import { useState, useEffect, DocumentData } from 'react';
import { collection, query, where, onSnapshot, DocumentSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Desktop {
  id: string;
  name: string;
  online: boolean;
  lastSeen: Date;
  sessions: SessionState[];
}

export interface SessionState {
  instance_id: string;
  email: string;
  concert_url: string;
  status: string;
  queue_position: string;
  proxy: string;
  effective_ip: string;
  timestamp: number;
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

    const q = query(
      collection(db, 'desktops'),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const desktopsData: Desktop[] = [];
      snapshot.forEach((doc: DocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        if (data) {
          desktopsData.push({
            id: doc.id,
            name: data.name || 'Desktop',
            online: data.online || false,
            lastSeen: data.lastSeen?.toDate() || new Date(),
            sessions: data.sessions || []
          });
        }
      });
      setDesktops(desktopsData);
      setLoading(false);
    }, (error) => {
      console.error('Error listening to desktops:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  return { desktops, loading };
}
