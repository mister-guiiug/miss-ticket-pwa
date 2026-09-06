/**
 * CE QUI A CHANGÉ ENTRE DEUX RELEVÉS — ET QUE PERSONNE NE REGARDAIT.
 *
 * L'app promet de surveiller une file d'attente et de PRÉVENIR quand elle est
 * franchie. Elle ne l'a jamais fait. `App` gardait bien une référence vers le
 * relevé précédent, mais celle-ci ne contenait que des IDENTIFIANTS ; pour
 * retrouver « l'état d'avant » d'une session connue, le code allait le chercher
 * dans le tableau COURANT :
 *
 *     previousSessionsRef.current.includes(id)
 *       ? sessions.find(s => s.instance_id === id)   // ← la session ELLE-MÊME
 *       : null
 *
 * La comparaison qui suivait — `previousSession.status !== session.status` —
 * confrontait donc une valeur à elle-même : toujours fausse. « Page d'achat
 * atteinte » et « Erreur de session » ne pouvaient pas partir, et n'ont jamais
 * pu. Seules les sessions absentes de la liste d'identifiants — les nouvelles —
 * étaient annoncées.
 *
 * D'où ce module : le relevé précédent est gardé ENTIER, et la comparaison
 * devient une fonction pure, qu'on peut éprouver sans monter l'app.
 *
 * IL DIT CE QUI ARRIVE, PAS COMMENT ON L'ÉCRIT. Les notices ne portent aucun
 * texte : `App` les traduit. Sans quoi la comparaison dépendrait de `t`, donc
 * de la langue courante — et changer de langue rejouerait un relevé.
 *
 * LES ABSTENTIONS, dans le même esprit que `sessionHistory.ts` : deux relevés
 * qui ne regardent pas la même chose ne se comparent pas. Le premier relevé et
 * le changement de poste ne concluent RIEN. Sans cette règle, ouvrir l'écran
 * d'un poste annoncerait comme « nouvelle » chaque session qui y tournait déjà,
 * et faire l'aller-retour vers la liste des postes le répéterait à chaque fois.
 * Une notification dit un ÉVÉNEMENT, pas le fait qu'on se soit mis à regarder.
 */
import {
  isErrorStatus,
  isPurchaseStatus,
  isWaitingStatus,
  type SessionState,
} from './sessionState';

/** Les sessions d'un poste, TELLES QU'ON LES VOIT à un instant donné. */
export interface SessionSnapshot {
  /** Le poste dont l'écran est ouvert — `undefined` quand il n'y en a aucun. */
  desktopId: string | undefined;
  sessions: readonly SessionState[];
}

/**
 * Un événement constaté entre deux relevés.
 *
 * `purchase-reached` est celui que le produit promet : la file a été franchie
 * pendant qu'on regardait. `new-*` annonce une session qui vient d'apparaître.
 */
export type SessionNotice =
  | { kind: 'new-purchase'; email: string; concertUrl: string }
  | { kind: 'new-waiting'; email: string; queuePosition: string }
  | { kind: 'purchase-reached'; email: string }
  | { kind: 'error'; email: string };

/**
 * Ce qu'il y a à annoncer entre `previous` et `current`, et rien d'autre.
 *
 * Idempotente par construction : elle ne lit que les deux relevés, si bien que
 * rejouer le même couple ne produit rien de neuf. C'est ce qui rend inoffensif
 * un effet qui se réexécute — au changement de langue, par exemple, ou sous le
 * double rendu de `StrictMode`.
 */
export function diffSessionNotices(
  previous: SessionSnapshot | null,
  current: SessionSnapshot
): SessionNotice[] {
  // Aucun écran de poste ouvert : ce relevé n'est celui de personne.
  if (current.desktopId === undefined) return [];
  // Le tout premier relevé n'a rien à comparer.
  if (previous === null) return [];
  // Deux postes différents portent des sessions différentes : ce qui « change »
  // entre eux n'est qu'un changement d'écran.
  if (previous.desktopId !== current.desktopId) return [];

  const before = new Map(
    previous.sessions.map(session => [session.instance_id, session.status])
  );
  const notices: SessionNotice[] = [];

  for (const session of current.sessions) {
    const previousStatus = before.get(session.instance_id);

    if (previousStatus === undefined) {
      // Inconnue du relevé précédent : elle vient de naître.
      if (isPurchaseStatus(session.status)) {
        notices.push({
          kind: 'new-purchase',
          email: session.email,
          concertUrl: session.concert_url,
        });
      } else if (isWaitingStatus(session.status)) {
        notices.push({
          kind: 'new-waiting',
          email: session.email,
          queuePosition: session.queue_position,
        });
      }
      continue;
    }

    // Un statut inchangé n'est pas un événement.
    if (previousStatus === session.status) continue;

    // On annonce le FRANCHISSEMENT, pas l'état : une session déjà en erreur qui
    // change de libellé d'erreur ne prévient pas une seconde fois.
    if (isPurchaseStatus(session.status) && !isPurchaseStatus(previousStatus)) {
      notices.push({ kind: 'purchase-reached', email: session.email });
    } else if (
      isErrorStatus(session.status) &&
      !isErrorStatus(previousStatus)
    ) {
      notices.push({ kind: 'error', email: session.email });
    }
  }

  return notices;
}
