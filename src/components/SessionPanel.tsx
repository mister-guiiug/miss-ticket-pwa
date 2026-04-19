import { useMemo } from 'react';
import { SessionState } from '../hooks/useDesktops';
import { useWindowSize } from '../hooks/useWindowSize';
import { stopSession, stopAllSessions } from '../lib/firebaseCommands';
import { SessionFilter } from './FilterBar';
import { HardDrive, Activity, Clock, AlertCircle, CheckCircle, Pause, Ban, XCircle } from 'lucide-react';

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

  const filteredSessions = useMemo(() => {
    let result = [...sessions];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.email.toLowerCase().includes(query) ||
        s.concert_url.toLowerCase().includes(query) ||
        s.instance_id.toLowerCase().includes(query) ||
        s.status.toLowerCase().includes(query)
      );
    }

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

    result.sort((a, b) => b.timestamp - a.timestamp);

    return result;
  }, [sessions, searchQuery, filter]);

  const stats = useMemo(() => ({
    total: sessions.length,
    connected: sessions.filter(s => s.status.toLowerCase().includes('connecté')).length,
    waiting: sessions.filter(s => s.status.toLowerCase().includes('attente')).length,
    purchase: sessions.filter(s => s.status.toLowerCase().includes('achat')).length,
  }), [sessions]);

  return (
    <div>
      {/* Title section */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{
          margin: '0 0 4px 0',
          fontSize: '22px',
          fontWeight: '700',
          color: 'var(--text-primary)',
        }}>
          Sessions de {desktopName}
        </h2>
        <p style={{
          margin: 0,
          fontSize: '14px',
          color: 'var(--text-secondary)',
        }}>
          Gérez les sessions actives sur ce desktop
        </p>
      </div>

      {/* Stats cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: '24px',
      }}>
        <StatCard label="Total" value={stats.total} icon={<HardDrive size={18} />} color="var(--text-primary)" />
        <StatCard label="Connectées" value={stats.connected} icon={<CheckCircle size={18} />} color="var(--success)" />
        <StatCard label="En attente" value={stats.waiting} icon={<Pause size={18} />} color="var(--warning)" />
        <StatCard label="Page achat" value={stats.purchase} icon={<Activity size={18} />} color="var(--info)" />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {sessions.length > 0 && (
          <button
            onClick={handleStopAll}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              backgroundColor: 'var(--error)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.25)';
            }}
          >
            <Ban size={16} />
            <span>Arrêter tout</span>
          </button>
        )}

        {filteredSessions.length !== sessions.length && (
          <div style={{
            padding: '10px 16px',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: '8px',
            fontSize: '14px',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Activity size={16} />
            <span>
              Affichage de {filteredSessions.length} sur {sessions.length} session{sessions.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Sessions list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
          <div style={{
            width: '40px',
            height: '40px',
            margin: '0 auto 16px',
            borderRadius: '50%',
            border: '3px solid var(--border-default)',
            borderTopColor: 'var(--primary-500)',
            animation: 'spin 1s linear infinite',
          }} />
          <p>Chargement des sessions...</p>
        </div>
      ) : sessions.length === 0 ? (
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
          }}>
            <HardDrive size={36} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <h3 style={{
            margin: '0 0 8px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--text-primary)',
          }}>
            Aucune session active
          </h3>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
            Ce desktop n'a pas de session en cours
          </p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div style={{
          padding: '48px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          textAlign: 'center',
        }}>
          <AlertCircle size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto 16px' }} />
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
            Aucune session ne correspond à votre recherche
          </p>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
        }}>
          {filteredSessions.map((session, index) => (
            <SessionItem
              key={session.instance_id}
              session={session}
              onStop={() => handleStopSession(session.instance_id)}
              isLast={index === filteredSessions.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div style={{
      padding: '16px',
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '12px',
      textAlign: 'center',
    }}>
      <div style={{
        width: '36px',
        height: '36px',
        margin: '0 auto 12px',
        borderRadius: '10px',
        backgroundColor: color === 'var(--text-primary)'
          ? 'var(--bg-tertiary)'
          : color.replace(')', ', 0.1)').replace('rgb', 'rgba').replace('var(', 'var('),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div style={{
        fontSize: '24px',
        fontWeight: '700',
        color,
        marginBottom: '4px',
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '12px',
        color: 'var(--text-secondary)',
        fontWeight: '500',
      }}>
        {label}
      </div>
    </div>
  );
}

interface SessionItemProps {
  session: SessionState;
  onStop: () => void;
  isLast: boolean;
}

function SessionItem({ session, onStop, isLast }: SessionItemProps) {
  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('connecté')) return { bg: 'var(--success-bg)', text: 'var(--success)', icon: CheckCircle };
    if (s.includes('attente')) return { bg: 'var(--warning-bg)', text: 'var(--warning)', icon: Pause };
    if (s.includes('achat')) return { bg: 'var(--info-bg)', text: 'var(--info)', icon: Activity };
    return { bg: 'var(--error-bg)', text: 'var(--error)', icon: XCircle };
  };

  const statusStyle = getStatusColor(session.status);
  const StatusIcon = statusStyle.icon;

  return (
    <div style={{
      padding: '16px',
      borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)',
      transition: 'background-color 0.15s',
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '16px',
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header: ID and Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '12px',
            flexWrap: 'wrap',
          }}>
            <span style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              color: 'var(--text-tertiary)',
              padding: '2px 8px',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: '4px',
            }}>
              {session.instance_id.slice(-8)}
            </span>

            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              backgroundColor: statusStyle.bg,
              color: statusStyle.text,
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
            }}>
              <StatusIcon size={12} />
              <span>{session.status}</span>
            </span>
          </div>

          {/* Email */}
          <div style={{
            fontSize: '15px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '4px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {session.email}
          </div>

          {/* URL */}
          <div style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginBottom: '8px',
          }}>
            {session.concert_url}
          </div>

          {/* Queue position */}
          {session.queue_position && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: 'var(--warning)',
              padding: '4px 10px',
              backgroundColor: 'var(--warning-bg)',
              borderRadius: '6px',
              fontWeight: '500',
              marginBottom: '8px',
            }}>
              <Pause size={12} />
              <span>Position {session.queue_position}</span>
            </div>
          )}

          {/* Timestamp and Proxy */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '11px',
            color: 'var(--text-tertiary)',
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} />
              <span>
                {new Date(session.timestamp).toLocaleString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>

            {session.proxy && (
              <div style={{
                padding: '2px 6px',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '4px',
                fontFamily: 'monospace',
              }}>
                {session.proxy}
              </div>
            )}
          </div>
        </div>

        {/* Stop button */}
        <button
          onClick={onStop}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            backgroundColor: 'var(--error)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#dc2626';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--error)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <Ban size={14} />
          <span>Arrêter</span>
        </button>
      </div>
    </div>
  );
}
