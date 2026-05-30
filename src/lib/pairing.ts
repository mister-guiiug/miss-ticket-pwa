import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Génère un code de 6 caractères
 */
export function generatePairingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Pas de 0/O, 1/I pour éviter confusion
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Initie l'appariement avec un desktop
 */
export async function initiatePairing(
  token: string,
  desktopId: string,
  userId: string
): Promise<boolean> {
  try {
    // Vérifier que le token existe et est valide
    const tokenRef = doc(db, 'pairing_tokens', token);
    const tokenDoc = await getDoc(tokenRef);

    if (!tokenDoc.exists()) {
      throw new Error('Code invalide');
    }

    const tokenData = tokenDoc.data();
    if (!tokenData) return false;

    // Vérifier expiration
    const expiresAt = tokenData.expiresAt?.toDate();
    if (expiresAt && expiresAt < new Date()) {
      throw new Error('Code expiré');
    }

    // Vérifier statut
    if (tokenData.status !== 'pending') {
      throw new Error('Code déjà utilisé');
    }

    // Vérifier que le desktopId correspond
    if (tokenData.desktopId !== desktopId) {
      throw new Error('Code invalide pour ce desktop');
    }

    // Marquer le token comme apparié
    await setDoc(
      tokenRef,
      {
        status: 'paired',
        pairedAt: serverTimestamp(),
        pairedBy: userId,
      },
      { merge: true }
    );

    // Créer/Mettre à jour le document desktop
    await setDoc(
      doc(db, 'desktops', desktopId),
      {
        userId,
        name: `Desktop ${desktopId.slice(-6)}`,
        online: true,
        lastSeen: serverTimestamp(),
        sessions: [],
      },
      { merge: true }
    );

    return true;
  } catch (error) {
    console.error('Pairing error:', error);
    throw error;
  }
}

/**
 * Parse un QR code au format missticket:pair?token=XXX&id=YYY
 */
export function parseQRCode(
  qrData: string
): { token: string; desktopId: string } | null {
  try {
    if (!qrData.startsWith('missticket:pair?')) {
      return null;
    }
    const params = new URLSearchParams(qrData.replace('missticket:pair?', ''));
    const token = params.get('token');
    const desktopId = params.get('id');

    if (!token || !desktopId) {
      return null;
    }

    return { token, desktopId };
  } catch {
    return null;
  }
}
