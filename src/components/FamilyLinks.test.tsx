import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { I18nProvider } from '../i18n';
import { FamilyLinks } from './FamilyLinks';

/**
 * « Signaler un problème » : l'URL vient d'`issue-report` du socle, qui la
 * compose et la teste. Ce qui est vérifié ici : le lien est sur l'accueil, à
 * côté du code source et du soutien, dans les deux langues ; il vise le
 * gabarit `bug.yml` de CE dépôt ; et il est recalculé au clic.
 */
const ISSUES = 'https://github.com/mister-guiiug/miss-ticket-pwa/issues/new?';

function renderLinks(locale: 'fr' | 'en') {
  localStorage.setItem('ticket_locale', locale);
  return render(
    <I18nProvider>
      <FamilyLinks />
    </I18nProvider>
  );
}

describe('FamilyLinks — signaler un problème', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('trois liens sur l’accueil, le signalement vise bug.yml du dépôt', () => {
    renderLinks('fr');
    expect(screen.getAllByRole('link')).toHaveLength(3);
    const link = screen.getByRole('link', { name: 'Signaler un problème' });
    const href = link.getAttribute('href') ?? '';
    expect(href.startsWith(ISSUES)).toBe(true);
    expect(new URL(href).searchParams.get('template')).toBe('bug.yml');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('parle anglais avec l’app', () => {
    renderLinks('en');
    expect(
      screen.getByRole('link', { name: 'Report a problem' })
    ).toBeInTheDocument();
  });

  it('recalcule l’URL au clic : l’écran courant y entre', () => {
    renderLinks('fr');
    const link = screen.getByRole('link', { name: 'Signaler un problème' });
    window.history.replaceState(null, '', '/?vue=historique');
    // jsdom ne navigue pas : le clic ne fait que réécrire le `href`.
    fireEvent.click(link);
    expect(decodeURIComponent(link.getAttribute('href') ?? '')).toContain(
      'vue=historique'
    );
  });
});
