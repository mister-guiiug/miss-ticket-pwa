/**
 * L'HISTORIQUE DES SESSIONS TERMINÉES — ET POURQUOI IL EST **LOCAL**.
 *
 * Miss Ticket sert à surveiller une file d'attente d'achat de billets. L'issue
 * d'une session — page d'achat atteinte, échec, arrêt demandé, position finale
 * dans la file — EST le résultat de l'usage. L'app n'en conservait rien : elle
 * n'affichait que l'état courant, et une session qui s'arrêtait disparaissait
 * de l'écran sans laisser de trace.
 *
 * LE CHOIX : `localStorage` (via le magasin versionné du socle), pas Firestore.
 * Quatre raisons, dans cet ordre :
 *
 *  1. **La PWA n'est pas la source de vérité, et ne doit pas s'y faire passer.**
 *     Elle est une TÉLÉCOMMANDE : c'est l'application desktop qui conduit les
 *     sessions et qui, seule, connaît leur issue réelle. Ce que la PWA peut
 *     honnêtement écrire, c'est ce qu'elle a VU — le dernier état observé avant
 *     que la session ne disparaisse de la collection. Publier cette observation
 *     dans Firestore la ferait passer pour un fait partagé et créerait une
 *     seconde source, divergente, sous une collection que le desktop ignore.
 *     Localement, sa portée est claire : « ce que cette télécommande a vu ».
 *  2. **Les règles de sécurité ne sont pas déployables ici.** Une nouvelle
 *     collection exigerait des règles Firestore, et leur déploiement passe par
 *     le workflow du dépôt, pas par cette branche. Une fonctionnalité dont les
 *     règles ne sont pas déployées est une fonctionnalité qui ne marche pas —
 *     ou pire, qui recopierait le `allow write: if true` que porte déjà
 *     `sessions`.
 *  3. **Le nuage n'achèterait pas la limite qui compte.** L'app ne voit la fin
 *     d'une session que si elle est ouverte au moment où celle-ci disparaît.
 *     Firestore n'y change rien : seul le desktop pourrait écrire une fin qu'on
 *     n'a pas vue. Ce qui manque, ce sont les notifications poussées — un autre
 *     chantier, explicitement hors de celui-ci.
 *  4. **Le socle donne exactement l'outil.** Enveloppe `{ v, data }`, chaîne de
 *     migrations, copie de côté AVANT toute perte possible. C'est ce que
 *     `./storage.ts` vient de poser pour les réglages ; l'historique s'y range.
 *
 * CE QUE ÇA COÛTE, ET QUI EST ASSUMÉ : l'historique ne suit pas l'utilisateur
 * d'un appareil à l'autre, et « Effacer les données locales » l'emporte. Le
 * jour où le desktop écrira lui-même l'issue de ses sessions, cette conservation
 * deviendra un cache et non plus la seule trace.
 */
import { createVersionedStore } from '@mister-guiiug/dev-pwa-config/versioned-store';
import {
  isErrorStatus,
  isPurchaseStatus,
  type SessionState,
} from './sessionState';
import { appStore } from './storage';

/**
 * L'issue d'une session, telle que la télécommande a pu la CONSTATER.
 *
 * `purchase` dit « la page d'achat a été atteinte », pas « l'achat a réussi » :
 * l'app ne voit que le statut publié par le desktop, et celui-ci s'arrête à la
 * page. Promettre l'achat serait une promesse qu'on ne tient pas.
 */
export type SessionOutcome = 'purchase' | 'error' | 'manual' | 'stopped';

export interface SessionHistoryEntry {
  instanceId: string;
  desktopId: string;
  desktopName: string;
  email: string;
  concertUrl: string;
  /** Le dernier statut publié avant la disparition. */
  lastStatus: string;
  /** La position dans la file au dernier relevé — vide si jamais annoncée. */
  queuePosition: string;
  outcome: SessionOutcome;
  /** Horodatage porté par la session elle-même (début observé). */
  startedAt: number;
  /** Quand la télécommande a constaté la disparition. */
  endedAt: number;
}

/** Un poste TEL QU'ON LE REGARDE à un instant donné. */
export interface ObservedDesktop {
  id: string;
  name: string;
  /**
   * `list` : les sessions embarquées dans le document du poste (écran des
   * postes). `detail` : celles-ci FUSIONNÉES avec la collection `sessions` du
   * poste ouvert. Les deux ne portent pas forcément les mêmes sessions — d'où
   * la règle : on ne compare que deux relevés de même portée.
   */
  scope: 'list' | 'detail';
  sessions: SessionState[];
}

export const HISTORY_VERSION = 1;

/**
 * Borne de l'historique. `localStorage` tient ~5 Mo pour TOUTE l'origine,
 * partagée avec les dix-huit autres apps de la famille : 200 entrées d'environ
 * 250 octets tiennent dans 50 Ko, et couvrent largement plusieurs mises en
 * vente.
 */
export const HISTORY_LIMIT = 200;

const HISTORY_KEY = 'history';

const OUTCOMES: readonly SessionOutcome[] = [
  'purchase',
  'error',
  'manual',
  'stopped',
];

/**
 * L'issue déduite du dernier statut connu.
 *
 * L'ORDRE EST UNE DÉCISION. Un échec reste un échec quel que soit qui a appuyé
 * sur « Arrêter » — c'est souvent POUR ÇA qu'on l'arrête. Et la page d'achat
 * atteinte est le résultat que l'utilisateur cherchait : la file a été
 * franchie, l'arrêt qui suit ne l'efface pas. « Arrêt demandé » ne vaut donc
 * que pour une session qu'on interrompt sans issue propre.
 *
 * Les libellés du desktop sont français et libres (`Connecté`, `En attente`,
 * `Page d'achat`, `Erreur …`) : on cherche des morceaux — le vocabulaire vit
 * dans `sessionState.ts`, pour que l'issue archivée et la notification qui
 * prévient disent la même chose du même statut.
 */
export function deriveOutcome(
  status: string,
  stoppedByUser: boolean
): SessionOutcome {
  if (isErrorStatus(status)) return 'error';
  if (isPurchaseStatus(status)) return 'purchase';
  if (stoppedByUser) return 'manual';
  return 'stopped';
}

function toEntry(
  session: SessionState,
  desktop: ObservedDesktop,
  endedAt: number,
  stoppedByUser: boolean
): SessionHistoryEntry {
  return {
    instanceId: session.instance_id,
    desktopId: desktop.id,
    desktopName: desktop.name,
    email: session.email,
    concertUrl: session.concert_url,
    lastStatus: session.status,
    queuePosition: session.queue_position,
    outcome: deriveOutcome(session.status, stoppedByUser),
    startedAt: session.timestamp,
    endedAt,
  };
}

/**
 * Les sessions qui ont DISPARU entre deux relevés — et rien d'autre.
 *
 * Deux abstentions, qui sont le cœur de la fonction : un poste absent du
 * nouveau relevé (désapparié, ou snapshot en cours) et un poste dont la portée
 * a changé ne donnent AUCUNE conclusion. Sans elles, changer d'écran remplirait
 * l'historique de fins imaginaires.
 */
export function diffEndedSessions(
  previous: readonly ObservedDesktop[],
  current: readonly ObservedDesktop[],
  endedAt: number,
  stoppedByUser: ReadonlySet<string>
): SessionHistoryEntry[] {
  const now = new Map(current.map(desktop => [desktop.id, desktop]));
  const ended: SessionHistoryEntry[] = [];

  for (const before of previous) {
    const after = now.get(before.id);
    if (!after || after.scope !== before.scope) continue;

    const live = new Set(after.sessions.map(s => s.instance_id));
    for (const session of before.sessions) {
      if (live.has(session.instance_id)) continue;
      ended.push(
        toEntry(session, after, endedAt, stoppedByUser.has(session.instance_id))
      );
    }
  }

  return ended;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/** Une entrée relue du disque, ou `null` si elle n'a plus de sens. */
function normalizeEntry(value: unknown): SessionHistoryEntry | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }
  const raw = value as Record<string, unknown>;
  const instanceId = asString(raw.instanceId);
  if (!instanceId) return null;
  return {
    instanceId,
    desktopId: asString(raw.desktopId),
    desktopName: asString(raw.desktopName),
    email: asString(raw.email),
    concertUrl: asString(raw.concertUrl),
    lastStatus: asString(raw.lastStatus),
    queuePosition: asString(raw.queuePosition),
    outcome: OUTCOMES.includes(raw.outcome as SessionOutcome)
      ? (raw.outcome as SessionOutcome)
      : 'stopped',
    startedAt: asNumber(raw.startedAt),
    endedAt: asNumber(raw.endedAt),
  };
}

/**
 * Un historique abîmé n'est pas un historique perdu : ce qui n'est plus une
 * entrée tombe, le reste est gardé. Seule une valeur qui n'est même pas une
 * liste lève — le socle la met alors de côté avant de repartir de zéro.
 */
function normalizeHistory(value: unknown): SessionHistoryEntry[] {
  if (!Array.isArray(value)) {
    throw new TypeError('historique : liste attendue');
  }
  return value
    .map(normalizeEntry)
    .filter((entry): entry is SessionHistoryEntry => entry !== null);
}

const historyStore = createVersionedStore<SessionHistoryEntry[]>({
  store: appStore,
  key: HISTORY_KEY,
  version: HISTORY_VERSION,
  // Aucune migration : la clé naît avec cette version. Une valeur sans
  // enveloppe sous `ticket_history` ne peut pas venir de cette app — le socle
  // la met de côté plutôt que de la deviner.
  migrations: {},
  validate: normalizeHistory,
  seed: () => [],
});

/** L'historique, du plus récemment terminé au plus ancien. */
export function loadHistory(): SessionHistoryEntry[] {
  return historyStore.load();
}

/**
 * Ajoute des sessions terminées et rend l'historique à jour.
 *
 * Idempotent par `instanceId` : le même identifiant ne s'archive qu'une fois,
 * même si deux relevés successifs le voient disparaître.
 */
export function recordEnded(
  entries: readonly SessionHistoryEntry[]
): SessionHistoryEntry[] {
  if (entries.length === 0) return loadHistory();

  const merged = new Map<string, SessionHistoryEntry>();
  for (const entry of loadHistory()) merged.set(entry.instanceId, entry);
  for (const entry of entries) {
    if (!merged.has(entry.instanceId)) merged.set(entry.instanceId, entry);
  }

  const next = [...merged.values()]
    .sort((a, b) => b.endedAt - a.endedAt)
    .slice(0, HISTORY_LIMIT);

  historyStore.save(next);
  return next;
}

/** Efface l'historique ET ses copies de côté. */
export function clearHistory(): void {
  historyStore.clear();
}
