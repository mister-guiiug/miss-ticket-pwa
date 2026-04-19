import { useState, useEffect, useCallback } from 'react';
import { User, signInAnonymously, updateProfile, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setForceUpdate] = useState({});

  // Fonction pour forcer la mise à jour de l'utilisateur
  const refreshUser = useCallback(async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      // Forcer un re-render en mettant à jour l'état avec un nouvel objet
      const refreshed = {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        displayName: auth.currentUser.displayName,
        photoURL: auth.currentUser.photoURL,
        emailVerified: auth.currentUser.emailVerified,
        isAnonymous: auth.currentUser.isAnonymous,
        providerId: auth.currentUser.providerId,
        refreshToken: auth.currentUser.refreshToken,
      } as User;
      setUser(refreshed);
      // Force un re-render du composant
      setForceUpdate({});
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        // Créer un nouvel objet pour forcer React à détecter le changement
        const userObj = {
          uid: authUser.uid,
          email: authUser.email,
          displayName: authUser.displayName,
          photoURL: authUser.photoURL,
          emailVerified: authUser.emailVerified,
          isAnonymous: authUser.isAnonymous,
          providerId: authUser.providerId,
          refreshToken: authUser.refreshToken,
        } as User;
        setUser(userObj);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithPseudo = async (pseudo: string): Promise<User> => {
    const result = await signInAnonymously(auth);

    // Mettre à jour le profil
    await updateProfile(result.user, { displayName: pseudo });

    // Créer le document user
    await setDoc(doc(db, 'users', result.user.uid), {
      pseudo,
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp()
    }, { merge: true });

    // Forcer le rechargement pour avoir le displayName à jour
    await result.user.reload();

    // Créer et retourner un nouvel objet utilisateur avec le displayName mis à jour
    const updatedUser = {
      uid: result.user.uid,
      email: result.user.email,
      displayName: pseudo, // Utiliser directement le pseudo pour garantir la mise à jour
      photoURL: result.user.photoURL,
      emailVerified: result.user.emailVerified,
      isAnonymous: result.user.isAnonymous,
      providerId: result.user.providerId,
      refreshToken: result.user.refreshToken,
    } as User;

    setUser(updatedUser);
    return updatedUser;
  };

  const signOut = async () => {
    await auth.signOut();
  };

  return { user, loading, signInWithPseudo, signOut, refreshUser };
}
