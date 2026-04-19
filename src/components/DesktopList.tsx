import { useMemo } from 'react';
import { Desktop, DesktopFilter, DesktopSort } from '../hooks/useDesktops';

interface DesktopListProps {
  desktops: Desktop[];
  loading: boolean;
  onSelectDesktop: (desktopId: string) => void;
  onPairNew: () => void;
  searchQuery: string;
  filter: DesktopFilter;
  sortBy: DesktopSort;
}

export function DesktopList({
  desktops,
  loading,
  onSelectDesktop,
  onPairNew,
  searchQuery,
  filter,
  sortBy
}: DesktopListProps) {
  // Filtrer et trier les desktops
  const filteredAndSortedDesktops = useMemo(() => {
    let result = [...desktops];

    // Filtrage par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(d =>
        d.name.toLowerCase().includes(query) ||
        d.id.toLowerCase().includes(query)
      );
    }

    // Filtrage par statut
    if (filter === 'online') {
      result = result.filter(d => d.online);
    } else if (filter === 'offline') {
      result = result.filter(d => !d.online);
    }

    // Tri
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'lastSeen':
          return b.lastSeen.getTime() - a.lastSeen.getTime();
        case 'sessions':
          const aSessions = a.sessions?.length || 0;
          const bSessions = b.sessions?.length || 0;
          return bSessions - aSessions;
        default:
          return 0;
      }
    });

    return result;
  }, [desktops, searchQuery, filter, sortBy]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary, #9ca3af)' }}>
        Chargement de vos desktops...
      </div>
    );
  }

  // Afficher un message si aucun desktop après filtrage
  if (filteredAndSortedDesktops.length === 0 && desktops.length > 0) {
    return (
      <div style={{
        backgroundColor: 'var(--card-bg, #1e1e2e)',
        padding: '48px',
        borderRadius: '8px',
        textAlign: 'center',
        border: '1px solid var(--border-color, #2d2d44)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
        <p style={{ color: 'var(--text-secondary, #9ca3af)', marginBottom: '8px' }}>
          Aucun desktop ne correspond à votre recherche
        </p>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary, #9ca3af)' }}>
          Essayez avec d'autres critères de recherche ou de filtrage
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Info de filtrage */}
      {filteredAndSortedDesktops.length !== desktops.length && (
        <div style={{
          padding: '8px 12px',
          backgroundColor: 'var(--secondary-bg, #2d2d44)',
          borderRadius: '6px',
          fontSize: '14px',
          color: 'var(--text-secondary, #9ca3af)',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>📊</span>
          <span>
            Affichage de {filteredAndSortedDesktops.length} sur {desktops.length} desktop{desktops.length > 1 ? 's' : ''}
          </span>
        </div>
      )}

      {desktops.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--card-bg, #1e1e2e)',
          padding: '48px',
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid var(--border-color, #2d2d44)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🖥️</div>
          <p style={{ color: 'var(--text-secondary, #9ca3af)', marginBottom: '24px' }}>
            Aucun desktop apparié
          </p>
          <button
            onClick={onPairNew}
            style={{
              padding: '12px 24px',
              backgroundColor: 'var(--primary-color, #ff6b6b)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Apparier un Desktop
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredAndSortedDesktops.map((desktop) => (
            <div
              key={desktop.id}
              onClick={() => onSelectDesktop(desktop.id)}
              style={{
                backgroundColor: 'var(--card-bg, #1e1e2e)',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #2d2d44)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary-color, #ff6b6b)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color, #2d2d44)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px'
                  }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {desktop.name}
                    </div>
                    {!desktop.online && (
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        backgroundColor: 'var(--secondary-bg, #2d2d44)',
                        borderRadius: '4px',
                        color: 'var(--text-secondary, #9ca3af)'
                      }}>
                        Hors ligne
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary, #9ca3af)' }}>
                    ID: {desktop.id.slice(-8)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary, #9ca3af)' }}>
                    Dernier vu: {desktop.lastSeen.toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Statut en ligne */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: desktop.online ? 'var(--success-color, #4ade80)' : 'var(--error-color, #ef4444)',
                      boxShadow: desktop.online ? '0 0 8px var(--success-color, #4ade80)' : 'none'
                    }} />
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary, #9ca3af)' }}>
                      {desktop.online ? 'En ligne' : 'Hors ligne'}
                    </span>
                  </div>

                  {/* Sessions actives */}
                  {desktop.sessions && desktop.sessions.length > 0 && (
                    <div style={{
                      padding: '4px 10px',
                      backgroundColor: 'var(--secondary-bg, #2d2d44)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: 'var(--primary-color, #ff6b6b)',
                      fontWeight: 'bold'
                    }}>
                      {desktop.sessions.length} session{desktop.sessions.length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
