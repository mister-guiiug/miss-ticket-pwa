import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * LES SEULES COMMANDES QUE LA PWA ENVOIE, ET LES CHAMPS DE CHACUNE.
 *
 * `launch_session` en faisait partie jusqu'au 30/09/2026 : `launchSession()`
 * écrivait l'e-mail ET le mot de passe du compte de billetterie, en clair, dans
 * un document de `commands`, une collection que les règles Firestore laissaient
 * alors lire à n'importe qui. Aucun écran ne l'appelait. Elle est retirée avant
 * que quelqu'un la câble : un mot de passe ne transite jamais par Firestore, et
 * lancer une session à distance demandera un protocole où les identifiants
 * restent sur le desktop.
 *
 * Cette liste est celle des règles (`validCommand` dans `firestore.rules`) :
 * l'une refuse avant l'envoi, les autres à l'arrivée. Ajouter une commande,
 * c'est modifier les deux.
 */
const ALLOWED_PAYLOAD_KEYS = {
  stop_session: ['instance_id'],
  stop_all: [],
  get_state: [],
} as const satisfies Record<string, readonly string[]>;

export type CommandAction = keyof typeof ALLOWED_PAYLOAD_KEYS;

export interface CommandPayload {
  instance_id?: string;
}

/**
 * Refuse, AVANT toute écriture, une commande inconnue ou une charge qui porte
 * autre chose que les champs de sa commande. Le typage n'y suffit pas : il
 * disparaît à l'exécution, et une charge assemblée ailleurs (`as`, JSON)
 * passerait. Le message nomme le champ, jamais sa valeur.
 */
function assertSendable(action: string, payload: object): void {
  if (!Object.hasOwn(ALLOWED_PAYLOAD_KEYS, action)) {
    throw new Error(
      `Commande « ${action} » refusée avant envoi : la PWA ne l'envoie pas.`
    );
  }
  const allowed: readonly string[] =
    ALLOWED_PAYLOAD_KEYS[action as CommandAction];
  const unexpected = Object.keys(payload).filter(key => !allowed.includes(key));
  if (unexpected.length > 0) {
    throw new Error(
      `Commande « ${action} » refusée avant envoi : champ inattendu ${unexpected.join(', ')}.`
    );
  }
}

export async function sendCommand(
  desktopId: string,
  userId: string,
  action: CommandAction,
  payload?: CommandPayload
): Promise<string> {
  const body = payload || {};
  assertSendable(action, body);

  const commandData = {
    desktopId,
    userId,
    action,
    payload: body,
    status: 'pending',
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'commands'), commandData);
  return docRef.id;
}

export async function stopSession(
  desktopId: string,
  userId: string,
  instanceId: string
): Promise<string> {
  return sendCommand(desktopId, userId, 'stop_session', {
    instance_id: instanceId,
  });
}

export async function stopAllSessions(
  desktopId: string,
  userId: string
): Promise<string> {
  return sendCommand(desktopId, userId, 'stop_all');
}

export async function refreshState(
  desktopId: string,
  userId: string
): Promise<string> {
  return sendCommand(desktopId, userId, 'get_state');
}
