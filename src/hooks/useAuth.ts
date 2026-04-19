import { useState, useEffect } from 'react';
import { User, signInAnonymously, updateProfile, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithPseudo = async (pseudo: string): Promise<User> => {
    const result = await signInAnonymously(auth);
    await updateProfile(result.user, { displayName: pseudo });

    // Créer le document user
    await setDoc(doc(db, 'users', result.user.uid), {
      pseudo,
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp()
    }, { merge: true });

    return result.user;
  };

  const signOut = async () => {
    await auth.signOut();
  };

  return { user, loading, signInWithPseudo, signOut };
}
