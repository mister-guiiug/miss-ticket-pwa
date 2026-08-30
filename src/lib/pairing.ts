import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import {
  ALPHABETS,
  generateCode,
  parseDeepLink,
} from '@mister-guiiug/dev-wpa-config/pairing';
import { db } from '../config/firebase';

/**
 * Source injectée dans `generateCode` : le tirage historique de ce module,
 * `Math.floor(Math.random() * 32)`, reproduit à l'identique. Les indices
 * 0..31 sont des octets valides, tous sous la limite de rejet (256), et
 * laissés inchangés par le `% 32` du socle : chaque valeur de `Math.random`
 * donne le même caractère qu'avant — les tests fixent ce comportement aux
 * extrêmes (0 → 'AAAAAA', 0.999… → '999999').
 *
 * Le tirage crypto par défaut du socle n'est volontairement PAS adopté ici :
 * ce serait un changement de comportement, hors du périmètre de cette PR.
 */
function mathRandomIndices(count: number): number[] {
  const size = ALPHABETS.antiConfusion.chars.length; // 32 — divise 256
  return Array.from({ length: count }, () => Math.floor(Math.random() * size));
}

/**
 * Génère un code de 6 caractères sur l'alphabet `antiConfusion` du socle
 * (sans 0/O ni 1/I — l'alphabet promu depuis ce dépôt).
 */
export function generatePairingCode(): string {
  return generateCode(6, {
    alphabet: 'antiConfusion',
    random: mathRandomIndices,
  });
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
 * Parse un QR code au format `missticket:pair?token=XXX&id=YYY`.
 *
 * Enveloppe locale au-dessus du `parseDeepLink` du socle — mêmes entrées et
 * sorties qu'avant, les composants n'y voient rien. Le format est ÉMIS par le
 * côté Rust de l'app desktop (dépôt miss-ticket, pairing_service.rs) : schéma
 * et action en minuscules, valeurs encodées façon `URLSearchParams` — que le
 * socle décode à l'identique de l'ancien parseur maison. L'action est
 * comparée à la casse près (`MISSTICKET:PAIR` → null), et token/id absents ou
 * vides restent rejetés ici.
 */
export function parseQRCode(
  qrData: string
): { token: string; desktopId: string } | null {
  const link = parseDeepLink(qrData, { scheme: 'missticket', action: 'pair' });
  if (!link) return null;

  const token = link.params.token;
  const desktopId = link.params.id;
  if (!token || !desktopId) return null;

  return { token, desktopId };
}
