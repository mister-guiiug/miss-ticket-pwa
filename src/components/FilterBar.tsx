import { useState } from 'react';
import { useWindowSize } from '../hooks/useWindowSize';

export type DesktopFilter = 'all' | 'online' | 'offline';
export type DesktopSort = 'name' | 'lastSeen' | 'sessions';
export type SessionFilter = 'all' | 'connected' | 'waiting' | 'purchase' | 'error';

interface FilterBarProps {
  type: 'desktop' | 'session';
  filter: DesktopFilter | SessionFilter;
  sort: DesktopSort;
  onFilterChange: (filter: DesktopFilter | SessionFilter) => void;
  onSortChange: (sort: DesktopSort) => void;
}

export function FilterBar({ type, filter, sort, onFilterChange, onSortChange }: FilterBarProps) {
  const { isMobile } = useWindowSize();
  const [showMenu, setShowMenu] = useState(false);

  const desktopFilters: { value: DesktopFilter; label: string; icon: string }[] = [
    { value: 'all', label: 'Tous', icon: '🖥️' },
    { value: 'online', label: 'En ligne', icon: '🟢' },
    { value: 'offline', label: 'Hors ligne', icon: '🔴' }
  ];

  const sessionFilters: { value: SessionFilter; label: string; icon: string }[] = [
    { value: 'all', label: 'Toutes', icon: '💻' },
    { value: 'connected', label: 'Connectées', icon: '🟢' },
    { value: 'waiting', label: 'En attente', icon: '⏳' },
    { value: 'purchase', label: 'Page achat', icon: '🛒' },
    { value: 'error', label: 'Erreurs', icon: '❌' }
  ];

  const sortOptions: { value: DesktopSort; label: string; icon: string }[] = [
    { value: 'name', label: 'Nom', icon: '🔤' },
    { value: 'lastSeen', label: 'Dernier vu', icon: '🕐' },
    { value: 'sessions', label: 'Sessions', icon: '📊' }
  ];

  const filters = type === 'desktop' ? desktopFilters : sessionFilters;
  const currentFilter = filters.find(f => f.value === filter);

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
      {/* Filtre */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--secondary-bg, #2d2d44)',
            color: 'var(--text-primary, #e0e0e0)',
            border: '1px solid var(--border-color, #2d2d44)',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>{currentFilter?.icon}</span>
          <span>{currentFilter?.label}</span>
          <span>{showMenu ? '▲' : '▼'}</span>
        </button>

        {showMenu && (
          <>
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 99
              }}
              onClick={() => setShowMenu(false)}
            />
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '8px',
              backgroundColor: 'var(--card-bg, #1e1e2e)',
              border: '1px solid var(--border-color, #2d2d44)',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
              minWidth: '180px',
              overflow: 'hidden',
              zIndex: 100
            }}>
              {filters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => {
                    onFilterChange(f.value);
                    setShowMenu(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: filter === f.value ? 'var(--primary-color, #ff6b6b)' : 'transparent',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>{f.icon}</span>
                  <span>{f.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Tri - seulement pour desktops */}
      {type === 'desktop' && (
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              const currentIndex = sortOptions.findIndex(s => s.value === sort);
              const nextIndex = (currentIndex + 1) % sortOptions.length;
              onSortChange(sortOptions[nextIndex].value);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--secondary-bg, #2d2d44)',
              color: 'var(--text-primary, #e0e0e0)',
              border: '1px solid var(--border-color, #2d2d44)',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            title={`Trier par: ${sortOptions.find(s => s.value === sort)?.label}`}
          >
            <span>📶</span>
            <span style={{ display: isMobile ? 'none' : 'inline' }}>
              {sortOptions.find(s => s.value === sort)?.label}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
