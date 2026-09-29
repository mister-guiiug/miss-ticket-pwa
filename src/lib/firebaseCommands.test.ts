/**
 * Tests de la construction des commandes envoyées au desktop via la collection
 * Firestore `commands` — Firestore entièrement mocké, aucun accès réseau.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addDoc, collection } from 'firebase/firestore';
import * as commands from './firebaseCommands';
import {
  sendCommand,
  stopSession,
  stopAllSessions,
  refreshState,
  type CommandAction,
  type CommandPayload,
} from './firebaseCommands';

// `config/firebase` initialise l'app Firebase au niveau module : on le
// remplace par un faux `db` pour garder les tests hermétiques.
vi.mock('../config/firebase', () => ({ db: { type: 'db-mock' } }));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db: unknown, name: string) => ({ name })),
  addDoc: vi.fn(),
  serverTimestamp: vi.fn(() => ({ __serverTimestamp: true })),
}));

const addDocMock = vi.mocked(addDoc);

/** Référence de document factice renvoyée par `addDoc`. */
function commandRef(id: string) {
  return { id } as unknown as Awaited<ReturnType<typeof addDoc>>;
}

/** Données effectivement écrites lors du n-ième appel à `addDoc` (0-indexé). */
function writtenCommand(call = 0): Record<string, unknown> {
  const args = addDocMock.mock.calls[call];
  if (!args) throw new Error(`addDoc n'a pas reçu d'appel n°${call + 1}`);
  return args[1] as unknown as Record<string, unknown>;
}

/**
 * Appelle `sendCommand` comme le ferait un code qui passe outre le typage :
 * une commande ou une charge assemblée ailleurs (`as`, JSON, `unknown`).
 * Renvoie l'erreur levée, pour en lire le message.
 */
async function sendUntyped(
  action: string,
  payload: Record<string, unknown>
): Promise<Error> {
  const error: unknown = await sendCommand(
    'desk-1',
    'user-1',
    action as CommandAction,
    payload as unknown as CommandPayload
  ).catch((e: unknown) => e);
  if (!(error instanceof Error)) {
    throw new Error(`sendCommand aurait dû refuser « ${action} »`);
  }
  return error;
}

beforeEach(() => {
  vi.clearAllMocks();
  addDocMock.mockResolvedValue(commandRef('cmd-1'));
});

describe('sendCommand', () => {
  it("écrit une commande 'pending' dans la collection commands", async () => {
    const id = await sendCommand('desk-1', 'user-1', 'get_state');

    expect(id).toBe('cmd-1');
    expect(vi.mocked(collection)).toHaveBeenCalledWith(
      expect.anything(),
      'commands'
    );
    expect(addDocMock).toHaveBeenCalledTimes(1);
    expect(writtenCommand()).toEqual({
      desktopId: 'desk-1',
      userId: 'user-1',
      action: 'get_state',
      payload: {},
      status: 'pending',
      createdAt: { __serverTimestamp: true },
    });
  });

  it('transmet le payload fourni tel quel', async () => {
    await sendCommand('desk-1', 'user-1', 'stop_session', {
      instance_id: 'inst-42',
    });

    expect(writtenCommand()).toMatchObject({
      action: 'stop_session',
      payload: { instance_id: 'inst-42' },
    });
  });

  it("renvoie l'identifiant du document créé", async () => {
    addDocMock.mockResolvedValue(commandRef('cmd-42'));

    await expect(sendCommand('desk-1', 'user-1', 'stop_all')).resolves.toBe(
      'cmd-42'
    );
  });

  it("propage l'échec d'écriture Firestore", async () => {
    addDocMock.mockRejectedValue(new Error('permission refusée'));

    await expect(sendCommand('desk-1', 'user-1', 'get_state')).rejects.toThrow(
      'permission refusée'
    );
  });
});

/**
 * UN MOT DE PASSE NE PASSE JAMAIS PAR FIRESTORE.
 *
 * `launchSession()` écrivait l'e-mail et le mot de passe du compte de
 * billetterie en clair dans `commands`. Elle est retirée (30/09/2026), et
 * `sendCommand`, par où passe toute commande, refuse désormais ce qu'elle
 * envoyait, avant d'écrire quoi que ce soit.
 */
describe('le lancement de session à distance', () => {
  it("n'est plus exporté", () => {
    expect(commands).not.toHaveProperty('launchSession');
  });

  it('refuse launch_session sans rien écrire', async () => {
    const error = await sendUntyped('launch_session', {
      email: 'fan@example.com',
      password: 's3cret',
      concert_url: 'https://billetterie.example/concert',
    });

    expect(error.message).toMatch(/launch_session/);
    expect(addDocMock).not.toHaveBeenCalled();
  });

  it('refuse un mot de passe glissé dans une commande permise', async () => {
    const error = await sendUntyped('stop_session', {
      instance_id: 'inst-1',
      password: 's3cret',
    });

    expect(error.message).toMatch(/password/);
    expect(addDocMock).not.toHaveBeenCalled();
  });

  it('nomme le champ refusé sans jamais en recopier la valeur', async () => {
    const error = await sendUntyped('stop_all', { password: 's3cret' });

    expect(error.message).toContain('password');
    expect(error.message).not.toContain('s3cret');
  });

  it('refuse aussi un champ inconnu, même anodin', async () => {
    const error = await sendUntyped('get_state', {
      concert_url: 'https://billetterie.example/concert',
    });

    expect(error.message).toMatch(/concert_url/);
    expect(addDocMock).not.toHaveBeenCalled();
  });

  it("refuse un nom hérité du prototype d'un objet", async () => {
    // `'constructor' in {}` vaut true : la garde lit les propres clés de la
    // liste, pas celles qu'un objet hérite.
    const error = await sendUntyped('constructor', {});

    expect(error.message).toMatch(/constructor/);
    expect(addDocMock).not.toHaveBeenCalled();
  });
});

describe('stopSession', () => {
  it("cible l'instance à arrêter", async () => {
    await stopSession('desk-1', 'user-1', 'inst-9');

    expect(writtenCommand()).toMatchObject({
      action: 'stop_session',
      payload: { instance_id: 'inst-9' },
    });
  });
});

describe('stopAllSessions', () => {
  it('envoie stop_all avec un payload vide', async () => {
    await stopAllSessions('desk-1', 'user-1');

    expect(writtenCommand()).toMatchObject({
      action: 'stop_all',
      payload: {},
    });
  });
});

describe('refreshState', () => {
  it('envoie get_state avec un payload vide', async () => {
    await refreshState('desk-1', 'user-1');

    expect(writtenCommand()).toMatchObject({
      action: 'get_state',
      payload: {},
    });
  });
});
