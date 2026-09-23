/**
 * Système de design Miss Ticket
 * Palette de couleurs moderne avec support dark/light mode
 */

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '32px',
  '4xl': '40px',
};

export const borderRadius = {
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '20px',
  full: '9999px',
};

export const fontSize = {
  xs: '12px',
  sm: '14px',
  base: '16px',
  lg: '18px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '30px',
};

/**
 * LES FONDS PRIMAIRES QUI PORTENT UN TEXTE BLANC, et eux seuls.
 *
 * Le blanc ne tient pas sur `--primary-500` (#f43f5e) : 3,67:1, sous le 4,5:1
 * qu'exige un libellé de 15 px. Le dégradé historique `500 → 600` des boutons
 * donnait 3,99:1 au pire sous les lettres de « Commencer » (mesuré le
 * 24/09/2026), dans les deux thèmes — l'échelle primaire ne bascule pas.
 *
 * Axe ne le voit pas : un fond en dégradé est classé « incomplete », et un
 * bouton désactivé n'est pas mesuré. La garde vit donc dans `theme.test.tsx`,
 * qui mesure chaque couleur nommée ci-dessous, dans les deux thèmes.
 *
 * Les tuiles de logo et l'interrupteur des réglages gardent `--primary-500` :
 * ils ne portent que du blanc NON textuel (icône, pastille du curseur), dont
 * le seuil est 3:1 (WCAG 1.4.11), tenu partout.
 */
export const PRIMARY_BUTTON_GRADIENT =
  'linear-gradient(135deg, var(--primary-600), var(--primary-700))';

/**
 * L'aplat : pastilles et compteurs (10 à 13 px), langue active des réglages
 * (14 px). Du texte, donc 4,5:1 aussi.
 */
export const PRIMARY_SOLID_FILL = 'var(--primary-600)';

/**
 * L'ANCIENNE CLÉ DE STOCKAGE, reprise par le socle.
 *
 * L'état du thème vient désormais de `ThemeProvider` / `useTheme`
 * (`@mister-guiiug/dev-pwa-config`), qui stocke sous `dwc_theme`. Miss Ticket
 * stockait sous `theme`. Sans reprise, chaque utilisateur déjà installé aurait
 * perdu son choix au premier chargement — une seule fois, sans erreur ni
 * trace. `legacyKeys` relit l'ancienne clé puis réécrit sous la neuve.
 */
export const THEME_LEGACY_KEYS: string[] = ['theme'];

/** La clé du socle. Dupliquée ici pour la seule amorce ci-dessous. */
const SOCLE_THEME_KEY = 'dwc_theme';

/**
 * L'amorce, avant React — l'équivalent local du script anti-FOUC du socle.
 *
 * POURQUOI PAS `theme-boot`. Le script engendré par le socle pose
 * `data-theme` sur `<html>` ; ici les couleurs ne viennent PAS d'un sélecteur
 * `[data-theme]` mais d'une quarantaine de variables CSS posées en ligne par
 * `applyTheme`. L'attribut ne peindrait donc rien, et le script serait du
 * bruit. Tant que ces couleurs ne sont pas décrites en CSS, c'est cette
 * fonction — et elle seule — qui joue son rôle.
 *
 * Elle duplique la lecture de `legacyKeys` du socle, exactement comme
 * `theme-boot` la duplique de `useTheme` : les deux doivent voir la même
 * préférence, sinon la page peint un thème que React repeint aussitôt.
 */
export function readBootTheme(): 'dark' | 'light' {
  try {
    for (const key of [SOCLE_THEME_KEY, ...THEME_LEGACY_KEYS]) {
      const value = localStorage.getItem(key);
      if (value === 'light' || value === 'dark') return value;
      // `system` est une valeur que le socle stocke : elle se résout comme une
      // absence de choix, donc contre le réglage du système.
      if (value === 'system') {
        return window.matchMedia?.('(prefers-color-scheme: dark)').matches ===
          true
          ? 'dark'
          : 'light';
      }
    }
  } catch {
    /* stockage refusé (navigation privée) : on retombe sur le défaut */
  }
  // Miss Ticket est une app sombre par défaut, et l'était déjà.
  return 'dark';
}

/**
 * Application des variables CSS pour le thème
 */
export function applyTheme(theme: 'dark' | 'light') {
  const root = document.documentElement;

  if (theme === 'dark') {
    // Background colors
    root.style.setProperty('--bg-primary', '#0a0a0a');
    root.style.setProperty('--bg-secondary', '#171717');
    root.style.setProperty('--bg-tertiary', '#262626');
    root.style.setProperty('--bg-card', '#1a1a1a');
    root.style.setProperty('--bg-elevated', '#262626');
    root.style.setProperty('--bg-hover', '#262626');

    // Text colors
    root.style.setProperty('--text-primary', '#fafafa');
    root.style.setProperty('--text-secondary', '#a3a3a3');
    root.style.setProperty('--text-tertiary', '#737373');
    root.style.setProperty('--text-muted', '#525252');

    // Border colors
    root.style.setProperty('--border-subtle', 'rgba(255, 255, 255, 0.08)');
    root.style.setProperty('--border-default', 'rgba(255, 255, 255, 0.12)');
    root.style.setProperty('--border-strong', 'rgba(255, 255, 255, 0.16)');

    // Primary brand
    root.style.setProperty('--primary-50', '#fff1f2');
    root.style.setProperty('--primary-100', '#ffe4e6');
    root.style.setProperty('--primary-200', '#fecdd3');
    root.style.setProperty('--primary-300', '#fda4af');
    root.style.setProperty('--primary-400', '#fb7185');
    root.style.setProperty('--primary-500', '#f43f5e');
    root.style.setProperty('--primary-600', '#e11d48');
    root.style.setProperty('--primary-700', '#be123c');

    // Semantic colors
    root.style.setProperty('--success', '#22c55e');
    root.style.setProperty('--success-bg', 'rgba(34, 197, 94, 0.1)');
    root.style.setProperty('--warning', '#f59e0b');
    root.style.setProperty('--warning-bg', 'rgba(245, 158, 11, 0.1)');
    root.style.setProperty('--error', '#ef4444');
    root.style.setProperty('--error-bg', 'rgba(239, 68, 68, 0.1)');
    root.style.setProperty('--info', '#3b82f6');
    root.style.setProperty('--info-bg', 'rgba(59, 130, 246, 0.1)');

    // Overlay
    root.style.setProperty('--overlay', 'rgba(0, 0, 0, 0.8)');

    // Header specific
    root.style.setProperty('--header-bg', 'rgba(10, 10, 10, 0.8)');
    root.style.setProperty('--header-border', 'rgba(255, 255, 255, 0.08)');

    // Les DEUX seuls jetons du contrat --dwc-* qui ne peuvent pas être écrits
    // en CSS : l'échelle `--primary-*` de cette app est IDENTIQUE dans les
    // deux thèmes, donc aucune variable existante ne bascule pour eux.
    // #f43f5e ne tient que 3,7:1 sur la carte sombre ; #fb7185 y donne 6,5:1.
    // Les treize autres pointent des variables qui basculent, et vivent dans
    // `index.css`.
    root.style.setProperty('--dwc-primary', '#fb7185');
    root.style.setProperty('--dwc-primary-contrast', '#0a0a0a');
  } else {
    // Background colors
    root.style.setProperty('--bg-primary', '#ffffff');
    root.style.setProperty('--bg-secondary', '#fafafa');
    root.style.setProperty('--bg-tertiary', '#f5f5f5');
    root.style.setProperty('--bg-card', '#ffffff');
    root.style.setProperty('--bg-elevated', '#ffffff');
    root.style.setProperty('--bg-hover', '#f5f5f5');

    // Text colors
    root.style.setProperty('--text-primary', '#171717');
    root.style.setProperty('--text-secondary', '#525252');
    root.style.setProperty('--text-tertiary', '#737373');
    root.style.setProperty('--text-muted', '#a3a3a3');

    // Border colors
    root.style.setProperty('--border-subtle', 'rgba(0, 0, 0, 0.06)');
    root.style.setProperty('--border-default', 'rgba(0, 0, 0, 0.1)');
    root.style.setProperty('--border-strong', 'rgba(0, 0, 0, 0.14)');

    // Primary brand
    root.style.setProperty('--primary-50', '#fff1f2');
    root.style.setProperty('--primary-100', '#ffe4e6');
    root.style.setProperty('--primary-200', '#fecdd3');
    root.style.setProperty('--primary-300', '#fda4af');
    root.style.setProperty('--primary-400', '#fb7185');
    root.style.setProperty('--primary-500', '#f43f5e');
    root.style.setProperty('--primary-600', '#e11d48');
    root.style.setProperty('--primary-700', '#be123c');

    // Semantic colors
    root.style.setProperty('--success', '#16a34a');
    root.style.setProperty('--success-bg', 'rgba(22, 163, 74, 0.1)');
    root.style.setProperty('--warning', '#d97706');
    root.style.setProperty('--warning-bg', 'rgba(217, 119, 6, 0.1)');
    root.style.setProperty('--error', '#dc2626');
    root.style.setProperty('--error-bg', 'rgba(220, 38, 38, 0.1)');
    root.style.setProperty('--info', '#2563eb');
    root.style.setProperty('--info-bg', 'rgba(37, 99, 235, 0.1)');

    // Overlay
    root.style.setProperty('--overlay', 'rgba(0, 0, 0, 0.5)');

    // Header specific
    root.style.setProperty('--header-bg', 'rgba(255, 255, 255, 0.8)');
    root.style.setProperty('--header-border', 'rgba(0, 0, 0, 0.06)');

    // Voir la branche sombre : #fb7185 ne tient que 2,7:1 sur blanc, #e11d48
    // y donne 4,7:1. Encre blanche par-dessus, 4,7:1 également.
    root.style.setProperty('--dwc-primary', '#e11d48');
    root.style.setProperty('--dwc-primary-contrast', '#ffffff');
  }
}
