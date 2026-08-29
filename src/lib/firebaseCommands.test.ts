/**
 * Tests de la construction des commandes envoyées au desktop via la collection
 * Firestore `commands` — Firestore entièrement mocké, aucun accès réseau.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addDoc, collection } from 'firebase/firestore';
import {
  sendCommand,
  launchSession,
  stopSession,
  stopAllSessions,
  refreshState,
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

describe('launchSession', () => {
  it('construit une commande launch_session complète', async () => {
    const id = await launchSession(
      'desk-1',
      'user-1',
      'fan@example.com',
      's3cret',
      'https://billetterie.example/concert',
      { host: 'proxy.local', port: 8080 }
    );

    expect(id).toBe('cmd-1');
    expect(writtenCommand()).toMatchObject({
      desktopId: 'desk-1',
      userId: 'user-1',
      action: 'launch_session',
      status: 'pending',
      payload: {
        email: 'fan@example.com',
        password: 's3cret',
        concert_url: 'https://billetterie.example/concert',
        proxy: { host: 'proxy.local', port: 8080 },
      },
    });
  });

  it('reste valide sans proxy', async () => {
    await launchSession(
      'desk-1',
      'user-1',
      'fan@example.com',
      's3cret',
      'https://billetterie.example/concert'
    );

    const payload = writtenCommand().payload as Record<string, unknown>;
    expect(payload.proxy).toBeUndefined();
    expect(payload).toEqual({
      email: 'fan@example.com',
      password: 's3cret',
      concert_url: 'https://billetterie.example/concert',
    });
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
