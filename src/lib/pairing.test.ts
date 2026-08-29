/**
 * Tests du module d'appariement : génération du code court, parsing du QR code
 * `missticket:pair?…` et flux d'appariement Firestore (entièrement mocké —
 * aucun accès réseau).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { generatePairingCode, initiatePairing, parseQRCode } from './pairing';

// `config/firebase` initialise l'app Firebase au niveau module : on le
// remplace par un faux `db` pour garder les tests hermétiques.
vi.mock('../config/firebase', () => ({ db: { type: 'db-mock' } }));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db: unknown, ...segments: string[]) => ({
    path: segments.join('/'),
  })),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(() => ({ __serverTimestamp: true })),
}));

type Snapshot = Awaited<ReturnType<typeof getDoc>>;

/** Fabrique un instantané Firestore minimal pour `getDoc`. */
function snapshot(
  data: Record<string, unknown> | undefined,
  exists = true
): Snapshot {
  return { exists: () => exists, data: () => data } as unknown as Snapshot;
}

/** Données d'un token d'appariement valide (à surcharger au besoin). */
function pendingToken(overrides: Record<string, unknown> = {}) {
  return {
    status: 'pending',
    desktopId: 'desktop-ABC123',
    expiresAt: { toDate: () => new Date(Date.now() + 60_000) },
    ...overrides,
  };
}

describe('generatePairingCode', () => {
  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  it("génère 6 caractères pris dans l'alphabet anti-confusion", () => {
    for (let i = 0; i < 250; i++) {
      const code = generatePairingCode();
      expect(code).toHaveLength(6);
      for (const char of code) {
        expect(ALPHABET).toContain(char);
      }
    }
  });

  it('ne produit jamais les caractères ambigus 0, O, 1, I', () => {
    const codes = Array.from({ length: 250 }, () => generatePairingCode());
    expect(codes.join('')).not.toMatch(/[0O1I]/);
  });

  it("reste dans les bornes de l'alphabet aux extrêmes de Math.random", () => {
    const random = vi.spyOn(Math, 'random');
    random.mockReturnValue(0);
    expect(generatePairingCode()).toBe('AAAAAA');
    // Math.random < 1 strictement : l'index retombe sur le dernier caractère.
    random.mockReturnValue(0.999999999);
    expect(generatePairingCode()).toBe('999999');
    random.mockRestore();
  });

  it("varie d'un tirage à l'autre", () => {
    const codes = new Set(
      Array.from({ length: 50 }, () => generatePairingCode())
    );
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe('parseQRCode', () => {
  it("extrait token et desktopId d'un QR code valide", () => {
    expect(parseQRCode('missticket:pair?token=tok-123&id=desktop-42')).toEqual({
      token: 'tok-123',
      desktopId: 'desktop-42',
    });
  });

  it("accepte les paramètres dans n'importe quel ordre", () => {
    expect(parseQRCode('missticket:pair?id=desktop-42&token=tok-123')).toEqual({
      token: 'tok-123',
      desktopId: 'desktop-42',
    });
  });

  it('ignore les paramètres supplémentaires', () => {
    expect(
      parseQRCode('missticket:pair?token=tok-123&id=desktop-42&extra=1')
    ).toEqual({ token: 'tok-123', desktopId: 'desktop-42' });
  });

  it('décode les valeurs encodées URL', () => {
    expect(
      parseQRCode('missticket:pair?token=a%3Db%26c&id=desk%20top')
    ).toEqual({
      token: 'a=b&c',
      desktopId: 'desk top',
    });
  });

  it('rejette un schéma étranger', () => {
    expect(parseQRCode('https://example.com/pair?token=a&id=b')).toBeNull();
  });

  it('est sensible à la casse sur le préfixe', () => {
    expect(parseQRCode('MISSTICKET:PAIR?token=a&id=b')).toBeNull();
  });

  it('rejette une chaîne vide ou un préfixe seul', () => {
    expect(parseQRCode('')).toBeNull();
    expect(parseQRCode('missticket:pair')).toBeNull();
    expect(parseQRCode('missticket:pair?')).toBeNull();
  });

  it('rejette un paramètre manquant ou vide', () => {
    expect(parseQRCode('missticket:pair?token=tok-123')).toBeNull();
    expect(parseQRCode('missticket:pair?id=desktop-42')).toBeNull();
    expect(parseQRCode('missticket:pair?token=&id=desktop-42')).toBeNull();
    expect(parseQRCode('missticket:pair?token=tok-123&id=')).toBeNull();
  });
});

describe('initiatePairing', () => {
  const getDocMock = vi.mocked(getDoc);
  const setDocMock = vi.mocked(setDoc);

  beforeEach(() => {
    vi.clearAllMocks();
    // initiatePairing loggue l'erreur avant de la relancer : on silencie.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejette un code inconnu sans rien écrire', async () => {
    getDocMock.mockResolvedValue(snapshot(undefined, false));

    await expect(
      initiatePairing('BADTOK', 'desktop-ABC123', 'user-1')
    ).rejects.toThrow(/^Code invalide$/);
    expect(setDocMock).not.toHaveBeenCalled();
  });

  it('rejette un code expiré', async () => {
    getDocMock.mockResolvedValue(
      snapshot(
        pendingToken({ expiresAt: { toDate: () => new Date(Date.now() - 1) } })
      )
    );

    await expect(
      initiatePairing('TOK123', 'desktop-ABC123', 'user-1')
    ).rejects.toThrow('Code expiré');
    expect(setDocMock).not.toHaveBeenCalled();
  });

  it('rejette un code déjà utilisé', async () => {
    getDocMock.mockResolvedValue(snapshot(pendingToken({ status: 'paired' })));

    await expect(
      initiatePairing('TOK123', 'desktop-ABC123', 'user-1')
    ).rejects.toThrow('Code déjà utilisé');
  });

  it('rejette un code émis pour un autre desktop', async () => {
    getDocMock.mockResolvedValue(snapshot(pendingToken()));

    await expect(
      initiatePairing('TOK123', 'desktop-AUTRE9', 'user-1')
    ).rejects.toThrow('Code invalide pour ce desktop');
    expect(setDocMock).not.toHaveBeenCalled();
  });

  it('renvoie false si le document existe sans données', async () => {
    getDocMock.mockResolvedValue(snapshot(undefined, true));

    await expect(
      initiatePairing('TOK123', 'desktop-ABC123', 'user-1')
    ).resolves.toBe(false);
    expect(setDocMock).not.toHaveBeenCalled();
  });

  it("accepte un token sans date d'expiration", async () => {
    getDocMock.mockResolvedValue(
      snapshot(pendingToken({ expiresAt: undefined }))
    );
    setDocMock.mockResolvedValue(undefined);

    await expect(
      initiatePairing('TOK123', 'desktop-ABC123', 'user-1')
    ).resolves.toBe(true);
  });

  it('marque le token apparié puis enregistre le desktop', async () => {
    getDocMock.mockResolvedValue(snapshot(pendingToken()));
    setDocMock.mockResolvedValue(undefined);

    await expect(
      initiatePairing('TOK123', 'desktop-ABC123', 'user-7')
    ).resolves.toBe(true);

    expect(vi.mocked(doc)).toHaveBeenCalledWith(
      expect.anything(),
      'pairing_tokens',
      'TOK123'
    );
    expect(setDocMock).toHaveBeenCalledTimes(2);
    expect(setDocMock).toHaveBeenNthCalledWith(
      1,
      { path: 'pairing_tokens/TOK123' },
      {
        status: 'paired',
        pairedAt: { __serverTimestamp: true },
        pairedBy: 'user-7',
      },
      { merge: true }
    );
    expect(setDocMock).toHaveBeenNthCalledWith(
      2,
      { path: 'desktops/desktop-ABC123' },
      {
        userId: 'user-7',
        name: 'Desktop ABC123',
        online: true,
        lastSeen: { __serverTimestamp: true },
        sessions: [],
      },
      { merge: true }
    );
  });

  it('propage une erreur Firestore', async () => {
    getDocMock.mockRejectedValue(new Error('Firestore indisponible'));

    await expect(
      initiatePairing('TOK123', 'desktop-ABC123', 'user-1')
    ).rejects.toThrow('Firestore indisponible');
  });
});
