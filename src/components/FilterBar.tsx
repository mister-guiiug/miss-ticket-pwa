import { useState } from 'react';
import { useWindowSize } from '../hooks/useWindowSize';
import {
  Filter as FilterIcon,
  ArrowUpDown,
  ChevronDown,
  Monitor,
  HardDrive,
} from 'lucide-react';

export type DesktopFilter = 'all' | 'online' | 'offline';
export type DesktopSort = 'name' | 'lastSeen' | 'sessions';
export type SessionFilter =
  | 'all'
  | 'connected'
  | 'waiting'
  | 'purchase'
  | 'error';

interface FilterBarProps {
  type: 'desktop' | 'session';
  filter: DesktopFilter | SessionFilter;
  sort: DesktopSort;
  onFilterChange: (filter: DesktopFilter | SessionFilter) => void;
  onSortChange: (sort: DesktopSort) => void;
}

export function FilterBar({
  type,
  filter,
  sort,
  onFilterChange,
  onSortChange,
}: FilterBarProps) {
  const { isMobile } = useWindowSize();
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const desktopFilters: { value: DesktopFilter; label: string }[] = [
    { value: 'all', label: 'Tous les desktops' },
    { value: 'online', label: 'En ligne' },
    { value: 'offline', label: 'Hors ligne' },
  ];

  const sessionFilters: { value: SessionFilter; label: string }[] = [
    { value: 'all', label: 'Toutes les sessions' },
    { value: 'connected', label: 'Connectées' },
    { value: 'waiting', label: 'En attente' },
    { value: 'purchase', label: "Page d'achat" },
    { value: 'error', label: 'Erreurs' },
  ];

  const sortOptions: { value: DesktopSort; label: string }[] = [
    { value: 'name', label: 'Nom' },
    { value: 'lastSeen', label: 'Dernier vu' },
    { value: 'sessions', label: 'Sessions' },
  ];

  const filters = type === 'desktop' ? desktopFilters : sessionFilters;
  const currentFilter = filters.find(f => f.value === filter);
  const currentSort = sortOptions.find(s => s.value === sort);

  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      {/* Filter Button */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowFilterMenu(!showFilterMenu)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            color: 'var(--text-primary)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--border-default)';
            e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
          }}
        >
          <FilterIcon size={16} style={{ color: 'var(--text-secondary)' }} />
          <span>{currentFilter?.label}</span>
          <ChevronDown
            size={14}
            style={{
              color: 'var(--text-tertiary)',
              transition: 'transform 0.2s',
              transform: showFilterMenu ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </button>

        {showFilterMenu && (
          <>
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 99,
              }}
              onClick={() => setShowFilterMenu(false)}
            />
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
                minWidth: '200px',
                overflow: 'hidden',
                zIndex: 100,
                animation: 'slideDown 0.2s ease-out',
              }}
            >
              {filters.map(f => (
                <button
                  key={f.value}
                  onClick={() => {
                    onFilterChange(f.value);
                    setShowFilterMenu(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 16px',
                    backgroundColor:
                      filter === f.value ? 'var(--bg-hover)' : 'transparent',
                    border: 'none',
                    color:
                      filter === f.value
                        ? 'var(--primary-500)'
                        : 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: filter === f.value ? '600' : '500',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    if (filter !== f.value) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (filter !== f.value) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {type === 'desktop' && f.value === 'all' && (
                    <Monitor size={16} />
                  )}
                  {type === 'session' && f.value === 'all' && (
                    <HardDrive size={16} />
                  )}
                  <span>{f.label}</span>
                  {filter === f.value && (
                    <div
                      style={{
                        marginLeft: 'auto',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary-500)',
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Sort Button - Desktops only */}
      {type === 'desktop' && (
        <button
          onClick={() => {
            const currentIndex = sortOptions.findIndex(s => s.value === sort);
            const nextIndex = (currentIndex + 1) % sortOptions.length;
            onSortChange(sortOptions[nextIndex].value);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            color: 'var(--text-primary)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--border-default)';
            e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
          }}
          title={`Trier par: ${currentSort?.label}`}
        >
          <ArrowUpDown size={16} style={{ color: 'var(--text-secondary)' }} />
          {!isMobile && <span>{currentSort?.label}</span>}
        </button>
      )}
    </div>
  );
}
