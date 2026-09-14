import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { I18nProvider } from '../i18n';

/**
 * CE QUE LA MIGRATION DOIT PRÉSERVER, ET CE QU'ELLE AJOUTE.
 *
 * `react-qr-reader` — une `3.0.0-beta-1` de février 2022, dépôt figé, 149
 * tickets — démarrait la caméra tout seul en se montant, et ne l'éteignait
 * qu'en se démontant. Le hook du socle demande un `start()` explicite, ce qui
 * déplace la responsabilité du cycle de vie DANS ce composant : c'est la seule
 * chose que la migration change vraiment, donc la seule qu'il faut éprouver.
 *
 * Ces tests ne vérifient pas que le décodage marche — c'est le travail du socle
 * et de sa peer. Ils vérifient que la caméra s'allume quand il faut, et surtout
 * qu'elle S'ÉTEINT : un flux laissé ouvert, c'est une diode allumée sur le
 * téléphone de l'utilisateur.
 */

const start = vi.fn();
const stop = vi.fn();
const options: { onScan?: (d: string) => void }[] = [];

vi.mock('@mister-guiiug/dev-pwa-config/react/use-qr-scanner', () => ({
  useQrScanner: (opts: { onScan?: (d: string) => void }) => {
    options.push(opts);
    return {
      videoRef: { current: null },
      scanning: true,
      error: null,
      start,
      stop,
    };
  },
}));

vi.mock('../lib/pairing', () => ({
  initiatePairing: vi.fn(async () => undefined),
  parseQRCode: (data: string) =>
    data.startsWith('missticket:pair?')
      ? { token: 'jeton', desktopId: 'poste-1' }
      : null,
}));

const { PairingDialog } = await import('./PairingDialog');

function monter() {
  return render(
    <I18nProvider>
      <PairingDialog userId="u1" onPaired={vi.fn()} onCancel={vi.fn()} />
    </I18nProvider>
  );
}

afterEach(() => {
  cleanup();
  start.mockClear();
  stop.mockClear();
  options.length = 0;
});

describe('PairingDialog — cycle de vie de la caméra', () => {
  it('allume la caméra à l’ouverture, onglet QR par défaut', () => {
    monter();
    expect(start).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /^QR/i })).toBeTruthy();
  });

  it('ÉTEINT la caméra quand on passe à la saisie manuelle', () => {
    monter();
    stop.mockClear();
    fireEvent.click(
      screen.getByRole('button', { name: /6 chiffres|6-digit/i })
    );
    // C'est le gain concret sur l'ancien composant, qui ne s'arrêtait qu'au
    // démontage : ici l'onglet « code » suffit à couper le flux.
    expect(stop).toHaveBeenCalled();
  });

  it('éteint la caméra au démontage', () => {
    const { unmount } = monter();
    stop.mockClear();
    unmount();
    expect(stop).toHaveBeenCalled();
  });

  it('rend une <video> que le socle peut câbler', () => {
    const { container } = monter();
    const video = container.querySelector('video');
    expect(video).not.toBeNull();
    // `playsInline` est indispensable sur iOS : sans lui, Safari ouvre le flux
    // en plein écran et le scan devient inutilisable dans le dialogue.
    expect(video?.hasAttribute('playsinline')).toBe(true);
  });

  it('passe le scan au même chemin d’appairage qu’avant', () => {
    monter();
    const onScan = options.at(-1)?.onScan;
    expect(typeof onScan).toBe('function');
    // Le hook rend une chaîne ; l'ancien composant rendait un objet dont on
    // tirait `getText()`. Le contrat d'entrée de `handlePairing` n'a pas bougé.
    expect(() => onScan?.('missticket:pair?token=x')).not.toThrow();
  });
});
