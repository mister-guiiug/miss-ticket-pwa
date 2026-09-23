import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import {
  ThemeProvider,
  ThemeToggle,
} from '@mister-guiiug/dev-pwa-config/react';
import { ThemePainter } from '../components/SocleProviders';
import {
  applyTheme,
  PRIMARY_BUTTON_GRADIENT,
  PRIMARY_SOLID_FILL,
  readBootTheme,
  THEME_LEGACY_KEYS,
} from './theme';

/**
 * La garantie qui compte pour l'utilisateur, et que rien ne couvrait.
 *
 * Le socle stocke le thème sous `dwc_theme` ; Miss Ticket stockait sous
 * `theme`. Adopter `useTheme` sans reprendre l'ancienne clé orpheline la
 * préférence de chaque utilisateur déjà installé : au premier chargement l'app
 * « oublie » son mode clair, une seule fois, sans erreur ni trace.
 *
 * Ici le défaut est `dark` : une reprise ratée se voit donc sur une préférence
 * CLAIRE, et c'est celle qu'on éprouve.
 */

/** L'arbre que monte `main.tsx`, sans le reste de l'app. */
function mount(props: { legacyKeys?: string[] } = {}) {
  return render(
    <ThemeProvider defaultTheme="dark" legacyKeys={props.legacyKeys}>
      <ThemePainter>
        <ThemeToggle />
      </ThemePainter>
    </ThemeProvider>
  );
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('style');
});

describe('reprise de la préférence de thème', () => {
  it('démarre en clair quand la préférence était stockée sous « theme »', () => {
    localStorage.setItem('theme', 'light');

    mount({ legacyKeys: THEME_LEGACY_KEYS });

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('repeint les variables CSS de l’app, pas seulement data-theme', () => {
    localStorage.setItem('theme', 'light');

    mount({ legacyKeys: THEME_LEGACY_KEYS });

    // `applyTheme` est ce qui donne réellement ses couleurs à Miss Ticket :
    // `data-theme` seul ne peint rien ici.
    expect(
      document.documentElement.style.getPropertyValue('--bg-primary')
    ).toBe('#ffffff');
  });

  it('réécrit la préférence sous la clé du socle, une seule fois', () => {
    localStorage.setItem('theme', 'light');

    mount({ legacyKeys: THEME_LEGACY_KEYS });

    expect(localStorage.getItem('dwc_theme')).toBe('light');
  });

  it('témoin : sans reprise, la même préférence est perdue', () => {
    localStorage.setItem('theme', 'light');

    mount();

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  /**
   * L'amorce tourne AVANT React, donc avant que `legacyKeys` n'ait migré quoi
   * que ce soit : si elle ne lisait que la clé neuve, la toute première
   * peinture après la mise à jour serait sombre pour un utilisateur en clair,
   * repeinte en clair aussitôt après. C'est le scintillement, une fois.
   */
  it('l’amorce avant React lit elle aussi l’ancienne clé', () => {
    localStorage.setItem('theme', 'light');

    expect(readBootTheme()).toBe('light');
  });

  it('l’amorce préfère la clé du socle quand les deux existent', () => {
    localStorage.setItem('theme', 'light');
    localStorage.setItem('dwc_theme', 'dark');

    expect(readBootTheme()).toBe('dark');
  });

  it('l’amorce retombe sur sombre, le défaut historique de Miss Ticket', () => {
    expect(readBootTheme()).toBe('dark');
  });
});

describe('bascule de thème du socle', () => {
  it('est un bouton dont le nom accessible annonce l’état courant', () => {
    localStorage.setItem('dwc_theme', 'dark');

    mount({ legacyKeys: THEME_LEGACY_KEYS });

    // Le libellé vient du socle (français par défaut) : « Thème : sombre.
    // Activer le thème système. » — l'état courant y figure, ce que l'ancien
    // bouton maison ne disait pas (il n'avait qu'un `title` sur l'action).
    const button = screen.getByRole('button', { name: /Thème : sombre/i });
    expect(button).toHaveAttribute('type', 'button');
  });

  it('cycle clair → sombre → système, sans laisser « système » hors d’atteinte', () => {
    localStorage.setItem('dwc_theme', 'dark');

    mount({ legacyKeys: THEME_LEGACY_KEYS });

    // Depuis « sombre », l'état suivant est « système » : l'ancienne bascule à
    // deux états ne permettait plus jamais d'y revenir.
    expect(
      screen.getByRole('button', { name: /Activer le thème système/i })
    ).toBeInTheDocument();
  });
});

/**
 * LA GARDE QU'AXE NE PEUT PAS TENIR.
 *
 * Un fond en dégradé est « incomplete » pour axe, et le bouton de connexion
 * est désactivé tant que le champ est vide : la suite e2e reste verte quel
 * que soit le contraste. On mesure donc les couleurs que `applyTheme` peint
 * vraiment, arrêt par arrêt. Les arrêts suffisent : de `600` à `700`, les
 * trois canaux décroissent ensemble, la luminance aussi.
 */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map(i => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrasteSurBlanc(hex: string): number {
  return 1.05 / (luminance(hex) + 0.05);
}

function peinte(variable: string): string {
  return document.documentElement.style.getPropertyValue(variable).trim();
}

describe('texte blanc sur les fonds primaires', () => {
  for (const theme of ['dark', 'light'] as const) {
    it(`tient 4,5:1 sur chaque couleur des boutons et des pastilles (${theme})`, () => {
      applyTheme(theme);

      for (const fond of [PRIMARY_BUTTON_GRADIENT, PRIMARY_SOLID_FILL]) {
        const variables = fond.match(/--primary-\d+/g) ?? [];
        expect(variables.length, fond).toBeGreaterThan(0);
        for (const variable of variables) {
          const couleur = peinte(variable);
          expect(couleur, variable).toMatch(/^#[0-9a-f]{6}$/i);
          expect(
            contrasteSurBlanc(couleur),
            `${variable} = ${couleur}`
          ).toBeGreaterThanOrEqual(4.5);
        }
      }
    });
  }

  it('témoin : le blanc ne tient pas sur --primary-500, l’ancien départ', () => {
    applyTheme('dark');

    expect(contrasteSurBlanc(peinte('--primary-500'))).toBeLessThan(4.5);
  });
});
