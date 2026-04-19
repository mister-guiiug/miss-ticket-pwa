import { SessionState } from '../hooks/useDesktops';
import { stopSession, stopAllSessions } from '../lib/firebaseCommands';

interface SessionPanelProps {
  desktopId: string;
  userId: string;
  sessions: SessionState[];
  loading: boolean;
  onBack: () => void;
}

export function SessionPanel({ desktopId, userId, sessions, loading, onBack }: SessionPanelProps) {
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

  const stats = {
    total: sessions.length,
    waiting: sessions.filter(s => s.status.toLowerCase().includes('attente')).length,
    purchase: sessions.filter(s => s.status.toLowerCase().includes('achat')).length
  };

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          padding: '8px 16px',
          backgroundColor: '#2d2d44',
          color: '#e0e0e0',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          cursor: 'pointer',
          marginBottom: '16px'
        }}
      >
        ← Retour
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <div style={{
          backgroundColor: '#1e1e2e',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #2d2d44'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.total}</div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>Sessions</div>
        </div>
        <div style={{
          backgroundColor: '#1e1e2e',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #2d2d44'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fbbf24' }}>
            {stats.waiting}
          </div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>En attente</div>
        </div>
        <div style={{
          backgroundColor: '#1e1e2e',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #2d2d44'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#60a5fa' }}>
            {stats.purchase}
          </div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>Page d'achat</div>
        </div>
      </div>

      {sessions.length > 0 && (
        <button
          onClick={handleStopAll}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ef4444',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer',
            marginBottom: '16px'
          }}
        >
          Arrêter tout
        </button>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
          Chargement des sessions...
        </div>
      ) : sessions.length === 0 ? (
        <div style={{
          backgroundColor: '#1e1e2e',
          padding: '48px',
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid #2d2d44'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💤</div>
          <p style={{ color: '#9ca3af' }}>
            Aucune session active
          </p>
        </div>
      ) : (
        <div style={{
          backgroundColor: '#1e1e2e',
          borderRadius: '8px',
          border: '1px solid #2d2d44'
        }}>
          {sessions.map((session) => (
            <div
              key={session.instance_id}
              style={{
                padding: '16px',
                borderBottom: '1px solid #2d2d44'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: '#9ca3af'
                }}>
                  {session.instance_id.slice(-8)}
                </span>
                <span style={{
                  fontSize: '12px',
                  color: session.status.toLowerCase().includes('connecté') ? '#4ade80' :
                         session.status.toLowerCase().includes('attente') ? '#fbbf24' :
                         session.status.toLowerCase().includes('achat') ? '#60a5fa' : '#ef4444'
                }}>
                  {session.status}
                </span>
              </div>
              <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                {session.email}
              </div>
              <div style={{
                fontSize: '11px',
                color: '#9ca3af',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginBottom: '8px'
              }}>
                {session.concert_url}
              </div>
              {session.queue_position && (
                <div style={{
                  fontSize: '12px',
                  color: '#fbbf24',
                  marginBottom: '8px'
                }}>
                  Position: {session.queue_position}
                </div>
              )}
              <button
                onClick={() => handleStopSession(session.instance_id)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Arrêter
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
