import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { I18nProvider } from '../i18n';
import { LoginForm } from './LoginForm';
import { OfflineBanner, SocleLabels } from './SocleProviders';

// Le double évite d'initialiser Firebase (et prouve qu'AUCUNE écriture n'est
// tentée hors connexion — c'est tout l'objet du garde).
const stopAllSessions = vi.fn((...args: string[]) => {
  void args;
  return Promise.resolve('id');
});
const stopSession = vi.fn((...args: string[]) => {
  void args;
  return Promise.resolve('id');
});
vi.mock('../lib/firebaseCommands', () => ({
  stopAllSessions: (...args: string[]) => stopAllSessions(...args),
  stopSession: (...args: string[]) => stopSession(...args),
}));

const { SessionPanel } = await import('./SessionPanel');

/**
 * TROIS DÉFAUTS ÉPROUVÉS PAR L'USAGE, PAS PAR LA MÉCANIQUE.
 *
 * 1. Rien ne disait à l'utilisateur qu'il était hors connexion, sinon une
 *    pastille décorative dans l'en-tête — absente de l'écran de connexion,
 *    qui est justement le premier endroit où la coupure fait mal.
 * 2. « Commencer » lançait `signInAnonymously`, qui REJETTE hors connexion.
 *    `handleSubmit` n'avait pas de `catch` : la promesse partait en
 *    `unhandledrejection` et il ne se passait RIEN à l'écran.
 * 3. Le bandeau doit se taire sur une micro-coupure. Un signal qui clignote
 *    est un signal qu'on apprend à ignorer.
 *
 * L'arbre monté reproduit celui de `main.tsx` (I18n + libellés du socle) :
 * c'est le CÂBLAGE qui est éprouvé, y compris le fait que le motif du garde
 * arrive traduit.
 */

/** La coupure telle que le navigateur l'annonce. */
function goOffline() {
  act(() => {
    window.dispatchEvent(new Event('offline'));
  });
}
function goOnline() {
  act(() => {
    window.dispatchEvent(new Event('online'));
  });
}
function wait(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

const banner = () => document.querySelector('[data-dwc="connection-banner"]');

beforeEach(() => {
  // La langue est choisie EXPLICITEMENT : sans elle, `createI18n` suit
  // `navigator.language` (anglais sous jsdom) et les assertions porteraient
  // sur une locale qui dépend de la machine.
  localStorage.setItem('ticket_locale', 'fr');
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('le shell dit qu’on est hors connexion — après un délai, pas avant', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function mount() {
    render(
      <I18nProvider>
        <SocleLabels>
          <OfflineBanner />
        </SocleLabels>
      </I18nProvider>
    );
  }

  it('ne dit rien tant que la coupure n’a pas duré', () => {
    mount();
    expect(banner()).toBeNull();

    goOffline();
    expect(banner()).toBeNull();

    wait(1499);
    expect(banner()).toBeNull();
  });

  it('ignore une micro-coupure : réseau revenu avant la fin du délai', () => {
    mount();
    goOffline();
    wait(900);
    expect(banner()).toBeNull();

    goOnline();
    wait(5000);
    expect(banner()).toBeNull();
  });

  it('parle après la temporisation, et dit ce qui ne partira pas', () => {
    mount();
    goOffline();
    wait(1500);

    const shown = banner();
    expect(shown).not.toBeNull();
    expect(shown).toHaveAttribute('role', 'status');
    // Pas « hors ligne » tout court : ce que l'utilisateur doit savoir, c'est
    // que ses commandes ne partiront pas.
    expect(shown).toHaveTextContent(/n’aboutiront pas/);
  });

  it('se tait dès le retour du réseau', () => {
    mount();
    goOffline();
    wait(1500);
    expect(banner()).not.toBeNull();

    goOnline();
    expect(banner()).toBeNull();
  });
});

describe('la connexion refuse de partir hors ligne, et dit pourquoi', () => {
  function mount(onLogin = vi.fn()) {
    render(
      <I18nProvider>
        <SocleLabels>
          <LoginForm onLogin={onLogin} />
        </SocleLabels>
      </I18nProvider>
    );
    return onLogin;
  }

  const submitButton = () => screen.getByRole('button', { name: /Commencer/ });

  it('en ligne : le bouton s’active dès qu’un pseudo est saisi', () => {
    mount();
    expect(submitButton()).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText('Votre pseudo'), {
      target: { value: 'Camille' },
    });

    expect(submitButton()).toBeEnabled();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('hors ligne : bouton désactivé ET motif affiché', () => {
    mount();
    fireEvent.change(screen.getByPlaceholderText('Votre pseudo'), {
      target: { value: 'Camille' },
    });

    goOffline();

    expect(submitButton()).toBeDisabled();
    // Le libellé traduit du paquet, pas une chaîne recopiée ici.
    expect(screen.getByRole('status')).toHaveTextContent(
      'Indisponible hors ligne'
    );
  });

  it('hors ligne : soumettre au clavier ne déclenche rien non plus', () => {
    const onLogin = mount();
    const input = screen.getByPlaceholderText('Votre pseudo');
    fireEvent.change(input, { target: { value: 'Camille' } });

    goOffline();

    // La touche Entrée soumet le formulaire sans passer par le bouton : c'est
    // le trou que `disabled` seul laisserait ouvert.
    fireEvent.submit(input.closest('form') as HTMLFormElement);

    expect(onLogin).not.toHaveBeenCalled();
  });
});

describe('arrêter une session hors ligne ne part plus dans le vide', () => {
  const session = {
    instance_id: 'i-1',
    email: 'a@b.fr',
    concert_url: 'https://example.test/concert',
    status: 'Connecté',
    queue_position: '',
    proxy: '',
    effective_ip: '',
    timestamp: Date.now(),
  };

  beforeEach(() => {
    // jsdom n'implémente pas `confirm` : sans ce double, la commande ne
    // partirait jamais et le test « en ligne » passerait pour de mauvaises
    // raisons — exactement ce qu'il est là pour exclure.
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    stopAllSessions.mockClear();
    stopSession.mockClear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mount() {
    render(
      <I18nProvider>
        <SocleLabels>
          <SessionPanel
            desktopId="d-1"
            desktopName="Poste 1"
            userId="u-1"
            sessions={[session]}
            loading={false}
            searchQuery=""
            filter="all"
          />
        </SocleLabels>
      </I18nProvider>
    );
  }

  const stopAllButton = () =>
    screen.getByRole('button', { name: /Arrêter tout/ });

  it('en ligne : la commande part', () => {
    mount();
    fireEvent.click(stopAllButton());
    expect(stopAllSessions).toHaveBeenCalledWith('d-1', 'u-1');
  });

  it('hors ligne : le bouton est marqué bloqué, porte son motif, et n’écrit rien', () => {
    mount();
    goOffline();

    const button = stopAllButton();
    // `aria-disabled`, pas `disabled` : le bouton reste focusable, donc le
    // motif reste découvrable au clavier.
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('title', 'Indisponible hors ligne');
    expect(screen.getByRole('status')).toHaveTextContent(
      'Indisponible hors ligne'
    );

    fireEvent.click(button);
    expect(stopAllSessions).not.toHaveBeenCalled();
  });

  it('hors ligne : l’arrêt d’une ligne est bloqué lui aussi', () => {
    mount();
    goOffline();

    const rowStop = screen.getByRole('button', { name: /^Arrêter$/ });
    expect(rowStop).toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(rowStop);
    expect(stopSession).not.toHaveBeenCalled();
  });
});
