import { useState, useEffect } from 'react';

type Theme = 'dark' | 'light';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme | null;
    return saved || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'dark') {
      root.style.setProperty('--header-bg', '#1a1a2e');
      root.style.setProperty('--card-bg', '#1e1e2e');
      root.style.setProperty('--secondary-bg', '#2d2d44');
      root.style.setProperty('--border-color', '#2d2d44');
      root.style.setProperty('--text-primary', '#e0e0e0');
      root.style.setProperty('--text-secondary', '#9ca3af');
      root.style.setProperty('--hover-bg', '#2d2d44');
      root.style.setProperty('--primary-color', '#ff6b6b');
      root.style.setProperty('--tooltip-bg', '#2d2d44');
      root.style.setProperty('--input-bg', '#0f0f1a');
      root.style.setProperty('--success-color', '#4ade80');
      root.style.setProperty('--warning-color', '#fbbf24');
      root.style.setProperty('--error-color', '#ef4444');
      root.style.setProperty('--info-color', '#60a5fa');
    } else {
      root.style.setProperty('--header-bg', '#ffffff');
      root.style.setProperty('--card-bg', '#f8f9fa');
      root.style.setProperty('--secondary-bg', '#e9ecef');
      root.style.setProperty('--border-color', '#dee2e6');
      root.style.setProperty('--text-primary', '#212529');
      root.style.setProperty('--text-secondary', '#6c757d');
      root.style.setProperty('--hover-bg', '#e9ecef');
      root.style.setProperty('--primary-color', '#ff6b6b');
      root.style.setProperty('--tooltip-bg', '#343a40');
      root.style.setProperty('--input-bg', '#ffffff');
      root.style.setProperty('--success-color', '#28a745');
      root.style.setProperty('--warning-color', '#ffc107');
      root.style.setProperty('--error-color', '#dc3545');
      root.style.setProperty('--info-color', '#17a2b8');
    }

    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      style={{
        background: 'none',
        border: '1px solid var(--border-color, #2d2d44)',
        color: 'var(--text-primary, #e0e0e0)',
        cursor: 'pointer',
        padding: '8px',
        fontSize: '16px',
        borderRadius: '8px',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--hover-bg, #2d2d44)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
      title={`Passer en mode ${theme === 'dark' ? 'clair' : 'sombre'}`}
    >
      {theme === 'dark' ? '🌙' : '☀️'}
    </button>
  );
}
