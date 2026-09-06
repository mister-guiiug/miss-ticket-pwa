import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { SessionState } from './sessionState';
import {
  HISTORY_LIMIT,
  HISTORY_VERSION,
  type ObservedDesktop,
  clearHistory,
  deriveOutcome,
  diffEndedSessions,
  loadHistory,
  recordEnded,
} from './sessionHistory';

/**
 * L'APP OUBLIAIT TOUT.
 *
 * Miss Ticket sert à surveiller une file d'attente d'achat de billets. Savoir
 * si la session a atteint la page d'achat, échoué, ou été arrêtée est LE
 * résultat de l'usage — et pourtant rien n'en était conservé : l'écran ne
 * montrait que l'état courant, et une session qui s'arrêtait disparaissait
 * sans laisser de trace.
 *
 * Ce fichier éprouve les deux pièces qui manquaient : reconnaître qu'une
 * session s'est terminée (et n'en rien conclure quand on ne regardait pas), et
 * conserver son issue.
 */

function session(over: Partial<SessionState> = {}): SessionState {
  return {
    instance_id: 'i-1',
    email: 'a@b.fr',
    concert_url: 'https://example.test/concert',
    status: 'Connecté',
    queue_position: '',
    proxy: '',
    effective_ip: '',
    timestamp: 1_000,
    ...over,
  };
}

function observed(
  over: Partial<ObservedDesktop> & { sessions: SessionState[] }
): ObservedDesktop {
  return { id: 'd-1', name: 'Poste 1', scope: 'list', ...over };
}

const NO_MANUAL_STOP = new Set<string>();

beforeEach(() => {
  localStorage.clear();
});
afterEach(() => {
  localStorage.clear();
});

describe('l’issue d’une session, lue dans son dernier état connu', () => {
  it('la page d’achat atteinte est le résultat, quoi qu’il arrive ensuite', () => {
    expect(deriveOutcome("Page d'achat", false)).toBe('purchase');
    // Même si l'utilisateur a ensuite appuyé sur « Arrêter » : ce qu'il
    // voulait savoir, c'est que la file avait été franchie.
    expect(deriveOutcome("Page d'achat", true)).toBe('purchase');
  });

  it('une erreur reste une erreur, quel que soit qui a arrêté', () => {
    expect(deriveOutcome('Erreur réseau', false)).toBe('error');
    expect(deriveOutcome('Échec du paiement', true)).toBe('error');
  });

  it('distingue l’arrêt demandé de la disparition subie', () => {
    expect(deriveOutcome('En attente', true)).toBe('manual');
    expect(deriveOutcome('En attente', false)).toBe('stopped');
  });
});

describe('reconnaître qu’une session s’est terminée', () => {
  it('archive la session qui a disparu, avec sa position finale dans la file', () => {
    const before = [
      observed({
        sessions: [
          session({ instance_id: 'i-1', status: 'En attente' }),
          session({ instance_id: 'i-2', queue_position: '2 431' }),
        ],
      }),
    ];
    const after = [observed({ sessions: [session({ instance_id: 'i-1' })] })];

    const ended = diffEndedSessions(before, after, 9_000, NO_MANUAL_STOP);

    expect(ended).toHaveLength(1);
    expect(ended[0]).toMatchObject({
      instanceId: 'i-2',
      desktopId: 'd-1',
      desktopName: 'Poste 1',
      concertUrl: 'https://example.test/concert',
      queuePosition: '2 431',
      outcome: 'stopped',
      startedAt: 1_000,
      endedAt: 9_000,
    });
  });

  it('retient que c’est l’utilisateur qui a demandé l’arrêt', () => {
    const before = [observed({ sessions: [session()] })];
    const after = [observed({ sessions: [] })];

    const ended = diffEndedSessions(before, after, 9_000, new Set(['i-1']));

    expect(ended[0]?.outcome).toBe('manual');
  });

  it('ne conclut RIEN sur un poste qu’on ne regarde plus', () => {
    // Le poste a quitté la liste (désapparié, ou snapshot en cours) : ses
    // sessions n'ont pas « fini », on a juste cessé de les voir. Conclure ici
    // remplirait l'historique de fins imaginaires.
    const before = [observed({ sessions: [session()] })];

    expect(diffEndedSessions(before, [], 9_000, NO_MANUAL_STOP)).toEqual([]);
  });

  it('ne conclut RIEN quand on change de façon de regarder', () => {
    // L'écran d'un poste et la liste des postes ne portent pas les mêmes
    // sessions : passer de l'un à l'autre fait « disparaître » des sessions
    // bien vivantes.
    const before = [observed({ scope: 'detail', sessions: [session()] })];
    const after = [observed({ scope: 'list', sessions: [] })];

    expect(diffEndedSessions(before, after, 9_000, NO_MANUAL_STOP)).toEqual([]);
  });

  it('n’archive pas une session toujours présente, même changée de statut', () => {
    const before = [
      observed({ sessions: [session({ status: 'En attente' })] }),
    ];
    const after = [
      observed({ sessions: [session({ status: "Page d'achat" })] }),
    ];

    expect(diffEndedSessions(before, after, 9_000, NO_MANUAL_STOP)).toEqual([]);
  });
});

describe('conserver l’historique localement', () => {
  const entry = (instanceId: string, endedAt: number) => ({
    instanceId,
    desktopId: 'd-1',
    desktopName: 'Poste 1',
    email: 'a@b.fr',
    concertUrl: 'https://example.test/concert',
    lastStatus: 'En attente',
    queuePosition: '',
    outcome: 'stopped' as const,
    startedAt: 1_000,
    endedAt,
  });

  it('relit ce qui a été enregistré, le plus récent en tête', () => {
    recordEnded([entry('i-1', 1_000)]);
    recordEnded([entry('i-2', 2_000)]);

    expect(loadHistory().map(e => e.instanceId)).toEqual(['i-2', 'i-1']);
  });

  it('écrit sous l’enveloppe versionnée du socle, préfixée par l’app', () => {
    recordEnded([entry('i-1', 1_000)]);

    const raw = localStorage.getItem('ticket_history');
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw as string).v).toBe(HISTORY_VERSION);
  });

  it('n’enregistre pas deux fois la même session', () => {
    recordEnded([entry('i-1', 1_000)]);
    recordEnded([entry('i-1', 5_000)]);

    expect(loadHistory()).toHaveLength(1);
  });

  it('borne l’historique pour ne pas remplir le stockage', () => {
    recordEnded(
      Array.from({ length: HISTORY_LIMIT + 10 }, (_, i) => entry(`i-${i}`, i))
    );

    const kept = loadHistory();
    expect(kept).toHaveLength(HISTORY_LIMIT);
    // Ce qu'on jette, c'est le plus ancien.
    expect(kept[0]?.endedAt).toBe(HISTORY_LIMIT + 9);
  });

  it('met de côté un historique illisible au lieu de le perdre', () => {
    localStorage.setItem('ticket_history', '[{tronqué');

    expect(loadHistory()).toEqual([]);
    expect(localStorage.getItem('ticket_history.backup-illisible')).toBe(
      '[{tronqué'
    );
  });

  it('laisse tomber une entrée abîmée sans jeter les autres', () => {
    localStorage.setItem(
      'ticket_history',
      JSON.stringify({ v: HISTORY_VERSION, data: [entry('i-1', 1_000), null] })
    );

    expect(loadHistory().map(e => e.instanceId)).toEqual(['i-1']);
  });

  it('s’efface sur demande, copies de côté comprises', () => {
    recordEnded([entry('i-1', 1_000)]);
    localStorage.setItem('ticket_history.backup-v0', 'vieux');

    clearHistory();

    expect(loadHistory()).toEqual([]);
    expect(localStorage.getItem('ticket_history.backup-v0')).toBeNull();
  });
});
