import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { Desktop } from './useDesktops';
import type { SessionState } from '../lib/sessionState';
import { loadHistory } from '../lib/sessionHistory';
import { clearAppData } from '../lib/storage';
import { useSessionHistory } from './useSessionHistory';

/**
 * LE CÂBLAGE, PAS LA MÉCANIQUE.
 *
 * `sessionHistory.ts` sait déduire une issue et écrire ; ses tests le
 * prouvent sur des relevés fabriqués. Ce fichier-ci éprouve la seule chose
 * qui restait : que l'app REGARDE — que les instantanés de Firestore qui
 * traversent `App` deviennent bien un historique, et que rien ne soit archivé
 * quand on a simplement cessé de regarder.
 *
 * C'est le défaut d'origine : l'app oubliait tout parce que PERSONNE ne
 * comparait deux relevés successifs.
 */

function session(over: Partial<SessionState> = {}): SessionState {
  return {
    instance_id: 'i-1',
    email: 'a@b.fr',
    concert_url: 'https://example.test/concert',
    status: 'En attente',
    queue_position: '',
    proxy: '',
    effective_ip: '',
    timestamp: 1_000,
    ...over,
  };
}

function desktop(over: Partial<Desktop> = {}): Desktop {
  return {
    id: 'd-1',
    name: 'Poste 1',
    online: true,
    lastSeen: new Date(0),
    sessions: [],
    ...over,
  };
}

type Props = Parameters<typeof useSessionHistory>[0];

function watch(initialProps: Props) {
  return renderHook((props: Props) => useSessionHistory(props), {
    initialProps,
  });
}

/** Le monde vu depuis la LISTE des postes, sans écran de poste ouvert. */
function fromList(sessions: SessionState[]): Props {
  return {
    desktops: [desktop({ sessions })],
    openDesktopId: undefined,
    openSessions: [],
  };
}

beforeEach(() => {
  localStorage.clear();
});
afterEach(() => {
  localStorage.clear();
});

describe('constater qu’une session s’est terminée', () => {
  it('n’archive rien au tout premier relevé', () => {
    // Sans cette garde, ouvrir l'app déclarerait « terminé » tout ce qui
    // tourne : l'historique naîtrait faux.
    const { result } = watch(fromList([session()]));

    expect(result.current.history).toEqual([]);
    expect(loadHistory()).toEqual([]);
  });

  it('archive la session disparue avec son issue et sa position finale', () => {
    const { result, rerender } = watch(
      fromList([
        session({ instance_id: 'i-1' }),
        session({ instance_id: 'i-2', queue_position: '2 431' }),
      ])
    );

    rerender(fromList([session({ instance_id: 'i-1' })]));

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0]).toMatchObject({
      instanceId: 'i-2',
      desktopName: 'Poste 1',
      queuePosition: '2 431',
      outcome: 'stopped',
    });
    // ET sur le disque : c'est là tout l'intérêt, l'app oubliait au
    // rechargement.
    expect(loadHistory().map(e => e.instanceId)).toEqual(['i-2']);
  });

  it('retient la page d’achat atteinte — le résultat qu’on venait chercher', () => {
    const { result, rerender } = watch(
      fromList([session({ status: "Page d'achat", queue_position: '' })])
    );

    rerender(fromList([]));

    expect(result.current.history[0]?.outcome).toBe('purchase');
  });

  it('distingue l’arrêt DEMANDÉ de la disparition subie', () => {
    const { result, rerender } = watch(fromList([session()]));

    act(() => {
      result.current.markStopRequested(['i-1']);
    });
    rerender(fromList([]));

    expect(result.current.history[0]?.outcome).toBe('manual');
  });

  it('ne conclut rien quand le poste lui-même quitte le relevé', () => {
    // Poste désapparié, ou instantané en cours de chargement : ses sessions
    // n'ont pas fini, on a cessé de les voir.
    const { result, rerender } = watch(fromList([session()]));

    rerender({ desktops: [], openDesktopId: undefined, openSessions: [] });

    expect(result.current.history).toEqual([]);
  });

  it('ne conclut rien en quittant l’écran d’un poste pour la liste', () => {
    // L'écran d'un poste ajoute la collection `sessions` à ce que porte le
    // document du poste. Revenir à la liste fait donc « disparaître » des
    // sessions bien vivantes — c'est le piège que la portée ferme.
    const { result, rerender } = watch({
      desktops: [desktop({ sessions: [] })],
      openDesktopId: 'd-1',
      openSessions: [session()],
    });

    rerender(fromList([]));

    expect(result.current.history).toEqual([]);
  });

  it('ne réarchive pas une session déjà consignée', () => {
    const { result, rerender } = watch(fromList([session()]));
    rerender(fromList([]));
    rerender(fromList([session()]));
    rerender(fromList([]));

    expect(result.current.history).toHaveLength(1);
  });
});

describe('effacer l’historique', () => {
  it('vide l’écran ET le disque', () => {
    const { result, rerender } = watch(fromList([session()]));
    rerender(fromList([]));
    expect(loadHistory()).toHaveLength(1);

    act(() => {
      result.current.clear();
    });

    expect(result.current.history).toEqual([]);
    expect(loadHistory()).toEqual([]);
  });

  it('« Effacer les données locales » l’emporte aussi', () => {
    // L'historique est une DONNÉE de l'app, pas une préférence : le bouton
    // des réglages doit l'emporter. Il vit sous le même préfixe `ticket_`,
    // donc `clearAppData` l'énumère — c'est ce que cette assertion fige.
    const { rerender } = watch(fromList([session()]));
    rerender(fromList([]));
    expect(loadHistory()).toHaveLength(1);

    clearAppData();

    expect(loadHistory()).toEqual([]);
  });
});
