import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { I18nProvider } from '../i18n';
import { SocleLabels } from './SocleProviders';
import type { SessionHistoryEntry } from '../lib/sessionHistory';
import type { HistoryFilter } from './FilterBar';
import { HistoryPanel } from './HistoryPanel';

/**
 * CE QUE L'ÉCRAN DOIT DIRE.
 *
 * Le produit sert à surveiller une file d'attente : la question à laquelle il
 * doit répondre est « est-ce que c'est passé ? ». Ces tests portent donc sur
 * l'ISSUE affichée et sur la position finale dans la file — pas sur la mise en
 * page.
 */

function entry(over: Partial<SessionHistoryEntry> = {}): SessionHistoryEntry {
  return {
    instanceId: 'i-1',
    desktopId: 'd-1',
    desktopName: 'Poste 1',
    email: 'camille@example.test',
    concertUrl: 'https://example.test/rock',
    lastStatus: 'En attente',
    queuePosition: '',
    outcome: 'stopped',
    startedAt: 1_000,
    endedAt: 9_000,
    ...over,
  };
}

function mount(
  entries: SessionHistoryEntry[],
  options: {
    searchQuery?: string;
    filter?: HistoryFilter;
    onClear?: () => void;
  } = {}
) {
  const onClear = options.onClear ?? vi.fn();
  render(
    <I18nProvider>
      <SocleLabels>
        <HistoryPanel
          entries={entries}
          searchQuery={options.searchQuery ?? ''}
          filter={options.filter ?? 'all'}
          onClear={onClear}
        />
      </SocleLabels>
    </I18nProvider>
  );
  return onClear;
}

beforeEach(() => {
  // La langue est choisie EXPLICITEMENT : sans elle, `createI18n` suit
  // `navigator.language` (anglais sous jsdom) et les assertions porteraient
  // sur une locale qui dépend de la machine.
  localStorage.setItem('ticket_locale', 'fr');
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('l’écran Historique', () => {
  it('sans rien à montrer, explique CE QU’IL montrera', () => {
    mount([]);

    expect(screen.getByText('Aucune session terminée')).toBeInTheDocument();
    // Et surtout pas de bouton « Vider » sur un historique déjà vide.
    expect(screen.queryByRole('button', { name: /Vider/ })).toBeNull();
  });

  it('dit l’issue de chaque session et sa position finale dans la file', () => {
    mount([
      entry({
        instanceId: 'i-1',
        outcome: 'purchase',
        email: 'camille@example.test',
      }),
      entry({
        instanceId: 'i-2',
        outcome: 'stopped',
        email: 'dominique@example.test',
        queuePosition: '2 431',
      }),
    ]);

    expect(screen.getByText('Page d’achat atteinte')).toBeInTheDocument();
    expect(screen.getByText('camille@example.test')).toBeInTheDocument();
    // Le chiffre qu'on regardait quand la session s'est arrêtée.
    expect(screen.getByText('Position finale : 2 431')).toBeInTheDocument();
  });

  it('annonce la PORTÉE de ce qu’il conserve', () => {
    // Un historique dont on ignore la portée passe pour un historique faux :
    // il ne voit que ce que cette télécommande, ouverte, a pu constater.
    mount([entry()]);

    expect(
      screen.getByText(/Conservé sur cet appareil uniquement/)
    ).toBeInTheDocument();
  });

  it('compte les issues qui décident du résultat', () => {
    mount([
      entry({ instanceId: 'i-1', outcome: 'purchase' }),
      entry({ instanceId: 'i-2', outcome: 'purchase' }),
      entry({ instanceId: 'i-3', outcome: 'error' }),
      entry({ instanceId: 'i-4', outcome: 'stopped' }),
    ]);

    const purchaseCard = screen.getByText('Page d’achat').closest('div')
      ?.parentElement as HTMLElement;
    expect(within(purchaseCard).getByText('2')).toBeInTheDocument();
    const errorCard = screen.getByText('Échecs').closest('div')
      ?.parentElement as HTMLElement;
    expect(within(errorCard).getByText('1')).toBeInTheDocument();
  });

  it('le filtre d’issue ne garde que celle demandée', () => {
    mount(
      [
        entry({ instanceId: 'i-1', outcome: 'purchase', email: 'ok@x.test' }),
        entry({ instanceId: 'i-2', outcome: 'error', email: 'ko@x.test' }),
      ],
      { filter: 'error' }
    );

    expect(screen.getByText('ko@x.test')).toBeInTheDocument();
    expect(screen.queryByText('ok@x.test')).toBeNull();
    // Le compteur dit ce qui est masqué, au lieu de laisser croire à un vide.
    expect(
      screen.getByText('Affichage de 1 sur 2 sessions')
    ).toBeInTheDocument();
  });

  it('la recherche du shell porte sur l’historique aussi', () => {
    mount(
      [
        entry({ instanceId: 'i-1', email: 'camille@example.test' }),
        entry({ instanceId: 'i-2', email: 'dominique@example.test' }),
      ],
      { searchQuery: 'dominique' }
    );

    expect(screen.getByText('dominique@example.test')).toBeInTheDocument();
    expect(screen.queryByText('camille@example.test')).toBeNull();
  });

  it('une recherche sans résultat le DIT, au lieu d’afficher un écran vide', () => {
    mount([entry()], { searchQuery: 'introuvable' });

    expect(
      screen.getByText(
        'Aucune session terminée ne correspond à votre recherche'
      )
    ).toBeInTheDocument();
    // Pas le message « aucune session terminée » : il y en a, elles sont
    // filtrées. Les deux états ne se confondent pas.
    expect(screen.queryByText('Aucune session terminée')).toBeNull();
  });

  it('vider l’historique demande confirmation avant d’effacer', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const onClear = mount([entry()]);

    fireEvent.click(screen.getByRole('button', { name: /Vider l’historique/ }));
    expect(confirmSpy).toHaveBeenCalled();
    expect(onClear).not.toHaveBeenCalled();

    confirmSpy.mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: /Vider l’historique/ }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
