import { describe, expect, it } from 'vitest';
import { toSessionState, toSessionStates } from './sessionState';

/**
 * LA FRONTIÈRE AVEC FIRESTORE.
 *
 * `SessionState` était un type que personne ne vérifiait : `useDesktops`
 * écrivait `sessions: data.sessions || []`, et comme Firestore rend du
 * `DocumentData` (donc `any`), le compilateur laissait passer n'importe quoi.
 * Les dégâts ne se voyaient qu'en aval, et sous forme d'exceptions :
 * `status.toLowerCase()` sur un statut absent, un `proxy` objet rendu comme
 * enfant React, une date « Invalid Date ».
 *
 * Ce test fige ce qui entre dans l'app — c'est le préalable à l'historique,
 * qui lit ces champs pour décider d'une issue.
 */

describe('normaliser une session venue de Firestore', () => {
  it('complète les champs absents plutôt que de les laisser indéfinis', () => {
    const state = toSessionState({}, 'i-1');

    expect(state).toMatchObject({
      instance_id: 'i-1',
      email: '',
      concert_url: '',
      // Un statut vide ferait une session « d'issue inconnue » silencieuse.
      status: 'Inconnu',
      queue_position: '',
      proxy: '',
      effective_ip: '',
    });
    expect(typeof state.timestamp).toBe('number');
  });

  it('accepte une position de file publiée en NOMBRE', () => {
    // Le desktop la publie tantôt en texte (« 2 431 »), tantôt en nombre.
    // `data.queue_position || ''` gardait le nombre sous un type `string`.
    expect(toSessionState({ queue_position: 2431 }, 'i-1').queue_position).toBe(
      '2431'
    );
  });

  it('refuse une valeur qui n’est pas du texte au lieu de la faire rendre', () => {
    // `launchSession` accepte un `proxy: unknown` : un objet arrivait jusqu'au
    // JSX, où React lève « Objects are not valid as a React child ».
    expect(
      toSessionState({ proxy: { host: 'x', port: 8080 } }, 'i-1').proxy
    ).toBe('');
  });

  it('prend l’identifiant porté par la session quand il n’en est pas donné', () => {
    // Les sessions embarquées dans le document d'un poste n'ont pas de
    // document à elles : leur identifiant est dans l'objet.
    expect(toSessionState({ instance_id: 'i-9' }).instance_id).toBe('i-9');
  });
});

describe('le tableau embarqué dans le document d’un poste', () => {
  it('rend une liste vide quand le champ n’est pas un tableau', () => {
    // `data.sessions || []` couvrait `undefined`, pas une valeur d'un autre
    // type — un poste mal écrit faisait alors lever `.map` en aval.
    expect(toSessionStates(undefined)).toEqual([]);
    expect(toSessionStates('deux sessions')).toEqual([]);
  });

  it('laisse tomber les entrées qui ne sont pas des objets, garde le reste', () => {
    const sessions = toSessionStates([null, 'x', { instance_id: 'i-1' }]);

    expect(sessions.map(s => s.instance_id)).toEqual(['i-1']);
  });
});
