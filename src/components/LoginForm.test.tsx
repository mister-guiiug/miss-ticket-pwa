import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { I18nProvider } from '../i18n';
import { LoginForm } from './LoginForm';
import { SocleLabels } from './SocleProviders';

beforeEach(() => {
  // jsdom rapporte `en-US` : sans la locale forcée, l'écran s'ouvre en anglais.
  localStorage.setItem('ticket_locale', 'fr');
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("l'écran de connexion dit ce qu'est l'app avant de demander un pseudo", () => {
  it('nom en h1, présentation, puis la demande', () => {
    render(
      <I18nProvider>
        <SocleLabels>
          <LoginForm onLogin={vi.fn()} />
        </SocleLabels>
      </I18nProvider>
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Miss Ticket' })
    ).toBeInTheDocument();
    const presentation = screen.getByText(/application de bureau Miss Ticket/);
    const demande = screen.getByText('Choisissez un pseudo pour commencer');
    // La présentation PRÉCÈDE la demande dans l'ordre du document : c'est
    // l'ordre de lecture d'un visiteur comme d'un moteur.
    expect(
      presentation.compareDocumentPosition(demande) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});
