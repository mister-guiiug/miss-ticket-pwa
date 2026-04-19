import { useMemo } from 'react';
import { SessionState } from '../hooks/useDesktops';
import { useWindowSize } from '../hooks/useWindowSize';
import { stopSession, stopAllSessions } from '../lib/firebaseCommands';
import { SessionFilter } from './FilterBar';

interface SessionPanelProps {
  desktopId: string;
  desktopName: string;
  userId: string;
  sessions: SessionState[];
  loading: boolean;
  searchQuery: string;
  filter: SessionFilter;
}

export function SessionPanel({
  desktopId,
  desktopName,
  userId,
  sessions,
  loading,
  searchQuery,
  filter
}: SessionPanelProps) {
  const { isMobile } = useWindowSize();

  const handleStopSession = async (instanceId: string) => {
    if (confirm('Arrêter cette session ?')) {
      await stopSession(desktopId, userId, instanceId);
    }
  };

  const handleStopAll = async () => {
    if (confirm('Arrêter toutes les sessions ?')) {
      await stopAllSessions(desktopId, userId);
    }
  };

  // Filtrer les sessions
  const filteredSessions = useMemo(() => {
    let result = [...sessions];

    // Filtrage par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.email.toLowerCase().includes(query) ||
        s.concert_url.toLowerCase().includes(query) ||
        s.instance_id.toLowerCase().includes(query) ||
        s.status.toLowerCase().includes(query)
      );
    }

    // Filtrage par statut
    if (filter === 'connected') {
      result = result.filter(s => s.status.toLowerCase().includes('connecté'));
    } else if (filter === 'waiting') {
      result = result.filter(s => s.status.toLowerCase().includes('attente'));
    } else if (filter === 'purchase') {
      result = result.filter(s => s.status.toLowerCase().includes('achat'));
    } else if (filter === 'error') {
      result = result.filter(s =>
        s.status.toLowerCase().includes('erreur') ||
        s.status.toLowerCase().includes('échec')
      );
    }

    // Trier par timestamp (plus récent en premier)
    result.sort((a, b) => b.timestamp - a.timestamp);

    return result;
  }, [sessions, searchQuery, filter]);

  // Calculer les stats sur toutes les sessions (pas seulement filtrées)
  const stats = useMemo(() => ({
    total: sessions.length,
    waiting: sessions.filter(s => s.status.toLowerCase().includes('attente')).length,
    purchase: sessions.filter(s => s.status.toLowerCase().includes('achat')).length,
    connected: sessions.filter(s => s.status.toLowerCase().includes('connecté')).length
  }), [sessions]);

  return (
    <div>
      {/* Titre avec nom du desktop */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', marginBottom: '8px' }}>
          Sessions de {desktopName}
        </h2>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary, #9ca3af)' }}>
          Gérez les sessions actives sur ce desktop
        </p>
      </div>

      {/* Stats cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <div style={{
          backgroundColor: 'var(--card-bg, #1e1e2e)',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid var(--border-color, #2d2d44)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.total}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary, #9ca3af)' }}>Total</div>
        </div>
        <div style={{
          backgroundColor: 'var(--card-bg, #1e1e2e)',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid var(--border-color, #2d2d44)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--success-color, #4ade80)' }}>
            {stats.connected}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary, #9ca3af)' }}>Connectées</div>
        </div>
        <div style={{
          backgroundColor: 'var(--card-bg, #1e1e2e)',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid var(--border-color, #2d2d44)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--warning-color, #fbbf24)' }}>
            {stats.waiting}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary, #9ca3af)' }}>En attente</div>
        </div>
        <div style={{
          backgroundColor: 'var(--card-bg, #1e1e2e)',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid var(--border-color, #2d2d44)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--info-color, #60a5fa)' }}>
            {stats.purchase}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary, #9ca3af)' }}>Page achat</div>
        </div>
      </div>

      {/* Actions globales */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {sessions.length > 0 && (
          <button
            onClick={handleStopAll}
            style={{
              padding: '10px 20px',
              backgroundColor: 'var(--error-color, #ef4444)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            🛑 Arrêter tout
          </button>
        )}

        {/* Info de filtrage */}
        {filteredSessions.length !== sessions.length && (
          <div style={{
            padding: '10px 16px',
            backgroundColor: 'var(--secondary-bg, #2d2d44)',
            borderRadius: '8px',
            fontSize: '14px',
            color: 'var(--text-secondary, #9ca3af)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>📊</span>
            <span>
              Affichage de {filteredSessions.length} sur {sessions.length} session{sessions.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Liste des sessions */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary, #9ca3af)' }}>
          Chargement des sessions...
        </div>
      ) : sessions.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--card-bg, #1e1e2e)',
          padding: '48px',
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid var(--border-color, #2d2d44)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💤</div>
          <p style={{ color: 'var(--text-secondary, #9ca3af)' }}>
            Aucune session active sur ce desktop
          </p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--card-bg, #1e1e2e)',
          padding: '48px',
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid var(--border-color, #2d2d44)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <p style={{ color: 'var(--text-secondary, #9ca3af)' }}>
            Aucune session ne correspond à votre recherche
          </p>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'var(--card-bg, #1e1e2e)',
          borderRadius: '8px',
          border: '1px solid var(--border-color, #2d2d44)',
          overflow: 'hidden'
        }}>
          {filteredSessions.map((session, index) => (
            <div
              key={session.instance_id}
              style={{
                padding: '16px',
                borderBottom: index < filteredSessions.length - 1 ? '1px solid var(--border-color, #2d2d44)' : 'none',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--hover-bg, #2d2d44)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: 'var(--text-secondary, #9ca3af)'
                }}>
                  {session.instance_id.slice(-8)}
                </span>
                <span style={{
                  fontSize: '12px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor:
                    session.status.toLowerCase().includes('connecté') ? 'rgba(74, 222, 128, 0.1)' :
                    session.status.toLowerCase().includes('attente') ? 'rgba(251, 191, 36, 0.1)' :
                    session.status.toLowerCase().includes('achat') ? 'rgba(96, 165, 250, 0.1)' :
                    'rgba(239, 68, 68, 0.1)',
                  color:
                    session.status.toLowerCase().includes('connecté') ? 'var(--success-color, #4ade80)' :
                    session.status.toLowerCase().includes('attente') ? 'var(--warning-color, #fbbf24)' :
                    session.status.toLowerCase().includes('achat') ? 'var(--info-color, #60a5fa)' :
                    'var(--error-color, #ef4444)'
                }}>
                  {session.status}
                </span>
              </div>

              <div style={{ fontSize: '14px', marginBottom: '4px', fontWeight: 'bold' }}>
                {session.email}
              </div>

              <div style={{
                fontSize: '11px',
                color: 'var(--text-secondary, #9ca3af)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginBottom: '8px'
              }}>
                {session.concert_url}
              </div>

              {session.queue_position && (
                <div style={{
                  display: 'inline-block',
                  fontSize: '12px',
                  color: 'var(--warning-color, #fbbf24)',
                  marginBottom: '8px',
                  padding: '4px 8px',
                  backgroundColor: 'rgba(251, 191, 36, 0.1)',
                  borderRadius: '4px'
                }}>
                  Position file: {session.queue_position}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary, #9ca3af)' }}>
                  {new Date(session.timestamp).toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <button
                  onClick={() => handleStopSession(session.instance_id)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'var(--error-color, #ef4444)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#dc3545';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--error-color, #ef4444)';
                  }}
                >
                  Arrêter
                </button>
              </div>

              {session.proxy && (
                <div style={{ fontSize: '11px', color: 'var(--text-secondary, #9ca3af)', marginTop: '8px' }}>
                  Proxy: {session.proxy}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
