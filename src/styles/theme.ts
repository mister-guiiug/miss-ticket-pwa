/**
 * Système de design Miss Ticket
 * Palette de couleurs moderne avec support dark/light mode
 */

export const colors = {
  // Primary colors
  primary: {
    50: '#fff1f2',
    100: '#ffe4e6',
    200: '#fecdd3',
    300: '#fda4af',
    400: '#fb7185',
    500: '#f43f5e', // Primary main
    600: '#e11d48',
    700: '#be123c',
    800: '#9f1239',
    900: '#881337',
  },

  // Neutral colors
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },

  // Semantic colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#22c55e',
    600: '#16a34a',
  },

  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    500: '#f59e0b',
    600: '#d97706',
  },

  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626',
  },

  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
  },
};

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

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
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

export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
};

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
  }
}

/**
 * Styles communs réutilisables
 */
export const commonStyles = {
  card: {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: borderRadius.lg,
  },

  input: {
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border-default)',
    borderRadius: borderRadius.md,
    color: 'var(--text-primary)',
    outline: 'none',
    transition: `border-color ${transitions.base}, box-shadow ${transitions.base}`,
  },

  button: {
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    fontSize: fontSize.sm,
    fontWeight: '500',
    transition: `all ${transitions.base}`,
  },

  buttonPrimary: {
    backgroundColor: 'var(--primary-500)',
    color: '#ffffff',
  },

  buttonSecondary: {
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
  },

  buttonGhost: {
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
  },
};
