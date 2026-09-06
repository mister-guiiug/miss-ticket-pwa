/**
 * CE QU'EST UNE SESSION, ET LA FRONTIÈRE QUI LE GARANTIT.
 *
 * Le type vivait dans `hooks/useDesktops.ts`, si bien que `lib/` devait
 * remonter vers `hooks/` pour le connaître. Il est ici parce qu'il ne décrit
 * pas un hook : il décrit la donnée du produit.
 *
 * SURTOUT, IL EST DÉSORMAIS VÉRIFIÉ. Firestore rend du `DocumentData`,
 * c'est-à-dire `any` : `useDesktops` écrivait `sessions: data.sessions || []`
 * et le compilateur laissait passer n'importe quoi sous un type qui promettait
 * huit champs. Les dégâts ne se voyaient qu'en aval, sous forme d'exceptions —
 * `status.toLowerCase()` sur un statut absent, un `proxy` objet rendu comme
 * enfant React, un horodatage manquant affiché « Invalid Date ». `useSessions`
 * normalisait déjà champ par champ, `useDesktops` non ; les deux passent
 * maintenant par la même fonction.
 */

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

/**
 * LE VOCABULAIRE DES STATUTS.
 *
 * Le desktop publie des libellés français et libres (`Connecté`, `En attente`,
 * `Page d'achat`, `Erreur réseau`, `Échec du paiement`) : l'app ne peut que
 * chercher des morceaux. Chaque endroit qui le faisait portait sa propre règle,
 * et elles avaient divergé — l'issue d'une session et le filtre du panneau
 * comptent `échec` comme une erreur, les notifications non. Une session en
 * échec ne prévenait donc personne, alors même qu'elle s'archivait en `error`.
 *
 * Ces trois prédicats sont la définition ; `sessionHistory` et les
 * notifications s'y rangent. Les filtres de `SessionPanel` gardent leurs
 * copies : ils appartiennent à l'affichage, et changer ce qu'ils montrent n'est
 * pas ce chantier.
 */
export function isPurchaseStatus(status: string): boolean {
  return status.toLowerCase().includes('achat');
}

export function isErrorStatus(status: string): boolean {
  const s = status.toLowerCase();
  return s.includes('erreur') || s.includes('échec');
}

export function isWaitingStatus(status: string): boolean {
  return status.toLowerCase().includes('attente');
}

function asText(value: unknown): string {
  if (typeof value === 'string') return value;
  // Le desktop publie parfois la position de file en nombre.
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

/**
 * Une session, quelle que soit la forme reçue.
 *
 * `instanceId` est fourni quand la session a son propre document (collection
 * `sessions`, l'identifiant est celui du document) ; il est absent quand la
 * session est embarquée dans le document d'un poste, où elle porte alors son
 * `instance_id`.
 */
export function toSessionState(
  raw: Record<string, unknown>,
  instanceId?: string
): SessionState {
  return {
    instance_id: instanceId ?? asText(raw.instance_id),
    email: asText(raw.email),
    concert_url: asText(raw.concert_url),
    status: asText(raw.status) || 'Inconnu',
    queue_position: asText(raw.queue_position),
    proxy: asText(raw.proxy),
    effective_ip: asText(raw.effective_ip),
    timestamp:
      typeof raw.timestamp === 'number' && Number.isFinite(raw.timestamp)
        ? raw.timestamp
        : Date.now(),
  };
}

/** Le tableau de sessions embarqué dans le document d'un poste. */
export function toSessionStates(value: unknown): SessionState[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === 'object' && item !== null && !Array.isArray(item)
    )
    .map(item => toSessionState(item));
}
