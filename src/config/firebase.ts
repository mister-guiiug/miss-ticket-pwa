import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth } from 'firebase/auth';

// Variables d'environnement requises. measurementId est optionnel (analytics).
const REQUIRED = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

const env = import.meta.env as unknown as Record<string, string | undefined>;

// Sans validation, une config incomplète laissait l'auth/Firestore échouer en
// silence (écran bloqué sans message). On échoue donc clairement : crash explicite
// en production (config manquante au build = bug de déploiement), simple
// avertissement en dev/test pour ne pas casser les imports.
const missing = REQUIRED.filter(key => !env[key]);
if (missing.length > 0) {
  const message =
    `[Firebase] Configuration incomplète — variables manquantes : ${missing.join(', ')}.\n` +
    `Renseignez les VITE_FIREBASE_* (.env.local en dev, secrets CI au build). Voir .env.example.`;
  if (env.PROD) throw new Error(message);
  else console.error(message);
}

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = initializeAuth(app, {
  persistence: undefined, // PWA gère sa propre persistance
});
