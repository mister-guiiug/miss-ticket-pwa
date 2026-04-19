interface MobileMenuProps {
  view: 'desktops' | 'sessions';
  sessionsCount: number;
  onNavigate: (view: 'desktops' | 'sessions') => void;
  onShowPairing: () => void;
  onRefresh: () => void;
  onClose: () => void;
}

export function MobileMenu({ view, sessionsCount, onNavigate, onShowPairing, onRefresh, onClose }: MobileMenuProps) {
  return (
    <div style={{
      marginTop: '16px',
      paddingTop: '16px',
      borderTop: '1px solid var(--border-color, #2d2d44)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      <button
        onClick={() => {
          onNavigate('desktops');
          onClose();
        }}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: view === 'desktops' ? 'var(--primary-color, #ff6b6b)' : 'var(--secondary-bg, #2d2d44)',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          textAlign: 'left',
          fontSize: '14px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        🖥️ Desktops
      </button>

      <button
        onClick={() => {
          onNavigate('sessions');
          onClose();
        }}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: view === 'sessions' ? 'var(--primary-color, #ff6b6b)' : 'var(--secondary-bg, #2d2d44)',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          textAlign: 'left',
          fontSize: '14px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          💻 Sessions
        </span>
        {sessionsCount > 0 && (
          <span style={{
            backgroundColor: 'var(--primary-color, #ff6b6b)',
            fontSize: '12px',
            fontWeight: 'bold',
            padding: '2px 8px',
            borderRadius: '10px'
          }}>
            {sessionsCount}
          </span>
        )}
      </button>

      {view === 'desktops' && (
        <button
          onClick={() => {
            onShowPairing();
            onClose();
          }}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: 'var(--secondary-bg, #2d2d44)',
            border: 'none',
            color: 'var(--text-primary, #e0e0e0)',
            cursor: 'pointer',
            textAlign: 'left',
            fontSize: '14px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          + Apparier un desktop
        </button>
      )}

      <button
        onClick={() => {
          onRefresh();
          onClose();
        }}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: 'var(--secondary-bg, #2d2d44)',
          border: 'none',
          color: 'var(--text-primary, #e0e0e0)',
          cursor: 'pointer',
          textAlign: 'left',
          fontSize: '14px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        🔄 Rafraîchir
      </button>
    </div>
  );
}
