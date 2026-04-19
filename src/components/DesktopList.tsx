import { Desktop } from '../hooks/useDesktops';

interface DesktopListProps {
  desktops: Desktop[];
  loading: boolean;
  onSelectDesktop: (desktopId: string) => void;
  onPairNew: () => void;
}

export function DesktopList({ desktops, loading, onSelectDesktop, onPairNew }: DesktopListProps) {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
        Chargement de vos desktops...
      </div>
    );
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h2 style={{ margin: 0, fontSize: '18px' }}>Mes Desktops</h2>
        <button
          onClick={onPairNew}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ff6b6b',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          + Apparier
        </button>
      </div>

      {desktops.length === 0 ? (
        <div style={{
          backgroundColor: '#1e1e2e',
          padding: '48px',
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid #2d2d44'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🖥️</div>
          <p style={{ color: '#9ca3af', marginBottom: '24px' }}>
            Aucun desktop apparié
          </p>
          <button
            onClick={onPairNew}
            style={{
              padding: '12px 24px',
              backgroundColor: '#ff6b6b',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Apparier un Desktop
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {desktops.map((desktop) => (
            <div
              key={desktop.id}
              onClick={() => onSelectDesktop(desktop.id)}
              style={{
                backgroundColor: '#1e1e2e',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #2d2d44',
                cursor: 'pointer',
                transition: 'border-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#ff6b6b';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#2d2d44';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                    {desktop.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                    ID: {desktop.id.slice(-8)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: desktop.online ? '#4ade80' : '#ef4444'
                  }} />
                  <span style={{ fontSize: '14px', color: '#9ca3af' }}>
                    {desktop.online ? 'En ligne' : 'Hors ligne'}
                  </span>
                </div>
              </div>
              {desktop.sessions && desktop.sessions.length > 0 && (
                <div style={{
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid #2d2d44',
                  fontSize: '14px',
                  color: '#9ca3af'
                }}>
                  {desktop.sessions.length} session{desktop.sessions.length > 1 ? 's' : ''} active{desktop.sessions.length > 1 ? 's' : ''}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
