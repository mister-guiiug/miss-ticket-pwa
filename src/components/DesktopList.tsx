import { useMemo } from 'react';
import { Monitor, Clock, Activity, Zap } from 'lucide-react';
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
      <div style={{
        textAlign: 'center',
        padding: '48px',
        color: 'var(--text-secondary)',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          margin: '0 auto 16px',
          borderRadius: '50%',
          border: '3px solid var(--border-default)',
          borderTopColor: 'var(--primary-500)',
          animation: 'spin 1s linear infinite',
        }} />
        <p>Chargement de vos desktops...</p>
      </div>
    );
  }

  if (filteredAndSortedDesktops.length === 0 && desktops.length > 0) {
    return (
      <EmptyState
        icon={<Monitor size={48} />}
        title="Aucun desktop trouvé"
        message="Aucun desktop ne correspond à votre recherche"
      />
    );
  }

  return (
    <div>
      {filteredAndSortedDesktops.length !== desktops.length && (
        <div style={{
          padding: '10px 16px',
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: '8px',
          fontSize: '14px',
          color: 'var(--text-secondary)',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <Activity size={16} />
          <span>
            Affichage de {filteredAndSortedDesktops.length} sur {desktops.length} desktop{desktops.length > 1 ? 's' : ''}
          </span>
        </div>
      )}

      {desktops.length === 0 ? (
        <EmptyState
          icon={<Monitor size={48} />}
          title="Aucun desktop apparié"
          message="Commencez par apparier un desktop pour utiliser l'application"
          actionLabel="Appairer un desktop"
          onAction={onPairNew}
        />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '16px',
        }}>
          {filteredAndSortedDesktops.map((desktop) => (
            <DesktopCard
              key={desktop.id}
              desktop={desktop}
              onClick={() => onSelectDesktop(desktop.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface DesktopCardProps {
  desktop: Desktop;
  onClick: () => void;
}

function DesktopCard({ desktop, onClick }: DesktopCardProps) {
  const sessionsCount = desktop.sessions?.length || 0;

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        padding: '20px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--primary-500)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Status indicator bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        backgroundColor: desktop.online ? 'var(--success)' : 'var(--text-tertiary)',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          backgroundColor: desktop.online ? 'var(--success-bg)' : 'var(--bg-tertiary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Monitor
            size={24}
            style={{ color: desktop.online ? 'var(--success)' : 'var(--text-tertiary)' }}
          />
        </div>

        {sessionsCount > 0 && (
          <div style={{
            padding: '4px 10px',
            backgroundColor: 'var(--primary-500)',
            color: '#ffffff',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '600',
          }}>
            {sessionsCount} session{sessionsCount > 1 ? 's' : ''}
          </div>
        )}
      </div>

      <h3 style={{
        margin: '0 0 4px 0',
        fontSize: '16px',
        fontWeight: '600',
        color: 'var(--text-primary)',
      }}>
        {desktop.name}
      </h3>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12px',
        color: 'var(--text-tertiary)',
        marginBottom: '8px',
      }}>
        <span style={{
          fontFamily: 'monospace',
          padding: '2px 6px',
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: '4px',
        }}>
          {desktop.id.slice(-8)}
        </span>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12px',
        color: 'var(--text-secondary)',
      }}>
        <Clock size={12} />
        <span>
          {desktop.lastSeen.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      </div>

      <div style={{
        marginTop: '12px',
        paddingTop: '12px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '13px',
        fontWeight: '500',
        color: desktop.online ? 'var(--success)' : 'var(--text-tertiary)',
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: desktop.online ? 'var(--success)' : 'var(--text-tertiary)',
        }} />
        <span>{desktop.online ? 'En ligne' : 'Hors ligne'}</span>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div style={{
      padding: '48px',
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '16px',
      textAlign: 'center',
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        margin: '0 auto 20px',
        borderRadius: '20px',
        backgroundColor: 'var(--bg-tertiary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-tertiary)',
      }}>
        {icon}
      </div>
      <h3 style={{
        margin: '0 0 8px 0',
        fontSize: '18px',
        fontWeight: '600',
        color: 'var(--text-primary)',
      }}>
        {title}
      </h3>
      <p style={{
        margin: '0 0 24px 0',
        fontSize: '14px',
        color: 'var(--text-secondary)',
      }}>
        {message}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
            border: 'none',
            borderRadius: '12px',
            color: '#ffffff',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(244, 63, 94, 0.3)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(244, 63, 94, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(244, 63, 94, 0.3)';
          }}
        >
          <Zap size={18} />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
