import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import {
  isAnalyticsLoaded,
  resetAnalytics,
} from '@mister-guiiug/dev-pwa-config/analytics';
import {
  readConsentChoice,
  writeConsentChoice,
} from '@mister-guiiug/dev-pwa-config/react/consent-banner';
import { CLE_DE_TEST } from '@mister-guiiug/dev-pwa-config/testing/posthog';
import { I18nProvider } from '../i18n';
import { Settings } from './Settings';
import { SocleLabels } from './SocleProviders';

/**
 * RETIRER SON CONSENTEMENT DOIT ÊTRE AUSSI SIMPLE QUE LE DONNER (RGPD, art.
 * 7.3). Au relevé du 29/09/2026, une fois le bandeau répondu, plus rien dans
 * l'app ne permettait de revenir sur son choix. Ces tests tiennent le chemin
 * du retour, des Paramètres jusqu'à la bibliothèque de mesure.
 */

// L'accord rejoué au montage charge la bibliothèque : la vraie partirait
// interroger PostHog depuis jsdom. Le double du socle se souvient du retrait.
vi.mock('posthog-js/dist/module.slim.js', async () => {
  const { fauxPosthog } =
    await import('@mister-guiiug/dev-pwa-config/testing/posthog');
  return { default: fauxPosthog() };
});

const UTILISATEUR = { displayName: 'Testeur', uid: 'uid-de-test-12345678' };

beforeEach(() => {
  localStorage.clear();
  // jsdom rapporte `en-US` : sans la locale forcée, l'écran s'ouvre en anglais.
  localStorage.setItem('ticket_locale', 'fr');
  vi.stubEnv('VITE_POSTHOG_KEY', CLE_DE_TEST);
  // L'état de la mesure est celui d'un module : sans remise à zéro, la
  // bibliothèque resterait « chargée » d'un test à l'autre.
  resetAnalytics();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllEnvs();
});

/** Les Paramètres, sous les fournisseurs de `main.tsx` qui les concernent. */
function monter() {
  const onClose = vi.fn();
  render(
    <I18nProvider>
      <SocleLabels>
        <Settings user={UTILISATEUR} onClose={onClose} />
      </SocleLabels>
    </I18nProvider>
  );
  return onClose;
}

describe('Paramètres - mesure d’audience', () => {
  it('les réglages permettent de retirer son consentement, en un clic', async () => {
    writeConsentChoice('granted');
    const onClose = monter();

    const titre = await screen.findByRole('heading', {
      name: 'Mesure d’audience',
    });
    const section = titre.closest('section') as HTMLElement;
    expect(within(section).getByRole('status')).toHaveTextContent(
      'Vous avez accepté cette mesure.'
    );
    // L'accord rejoué au montage a chargé la bibliothèque - le double.
    await waitFor(() => expect(isAnalyticsLoaded()).toBe(true));
    const posthog = (await import('posthog-js/dist/module.slim.js')).default;
    expect(posthog.has_opted_out_capturing()).toBe(false);

    fireEvent.click(
      within(section).getByRole('button', {
        name: 'Retirer mon consentement',
      })
    );

    expect(readConsentChoice()).toBe('denied');
    // Le clic est PARVENU à la bibliothèque, pas seulement au libellé.
    expect(posthog.has_opted_out_capturing()).toBe(true);
    expect(within(section).getByRole('status')).toHaveTextContent(
      'Vous avez refusé cette mesure.'
    );
    // Retiré sur place : les Paramètres restent ouverts, la question n'est
    // pas reposée.
    expect(onClose).not.toHaveBeenCalled();
  });

  it('parle la langue des Paramètres', async () => {
    localStorage.setItem('ticket_locale', 'en');
    writeConsentChoice('granted');
    monter();

    const titre = await screen.findByRole('heading', {
      name: 'Audience measurement',
    });
    const section = titre.closest('section') as HTMLElement;
    expect(within(section).getByRole('status')).toHaveTextContent(
      'You have accepted this measurement.'
    );
    expect(
      within(section).getByRole('button', { name: 'Withdraw my consent' })
    ).toBeInTheDocument();
  });

  it('« Modifier mon choix » ferme les Paramètres, qui cachent le bandeau', async () => {
    writeConsentChoice('denied');
    const onClose = monter();

    const titre = await screen.findByRole('heading', {
      name: 'Mesure d’audience',
    });
    const section = titre.closest('section') as HTMLElement;
    expect(within(section).getByRole('status')).toHaveTextContent(
      'Vous avez refusé cette mesure.'
    );

    fireEvent.click(
      within(section).getByRole('button', { name: 'Modifier mon choix' })
    );

    // Le bandeau rouvert est en bas de la page, sous la surimpression : elle
    // doit se fermer pour qu'il paraisse.
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(readConsentChoice()).toBeNull();
  });
});
