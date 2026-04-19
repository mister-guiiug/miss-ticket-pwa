import { Monitor, HardDrive, RefreshCw, Plus } from 'lucide-react';

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
      borderTop: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      animation: 'slideDown 0.2s ease-out',
    }}>
      <MobileMenuItem
        icon={<Monitor size={18} />}
        label="Desktops"
        active={view === 'desktops'}
        onClick={() => {
          onNavigate('desktops');
          onClose();
        }}
      />

      <MobileMenuItem
        icon={<HardDrive size={18} />}
        label="Sessions"
        active={view === 'sessions'}
        badge={sessionsCount > 0 ? sessionsCount : undefined}
        onClick={() => {
          onNavigate('sessions');
          onClose();
        }}
      />

      {view === 'desktops' && (
        <MobileMenuItem
          icon={<Plus size={18} />}
          label="Apparier un desktop"
          onClick={() => {
            onShowPairing();
            onClose();
          }}
        />
      )}

      <MobileMenuItem
        icon={<RefreshCw size={18} />}
        label="Rafraîchir"
        onClick={() => {
          onRefresh();
          onClose();
        }}
      />
    </div>
  );
}

interface MobileMenuItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
  onClick: () => void;
}

function MobileMenuItem({ icon, label, active = false, badge, onClick }: MobileMenuItemProps) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '12px 16px',
        backgroundColor: active ? 'var(--bg-hover)' : 'transparent',
        border: 'none',
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        cursor: 'pointer',
        fontSize: '15px',
        fontWeight: active ? '600' : '500',
        borderRadius: '8px',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {icon}
        <span>{label}</span>
      </div>

      {badge !== undefined && (
        <span style={{
          backgroundColor: 'var(--primary-500)',
          color: '#ffffff',
          fontSize: '12px',
          fontWeight: '700',
          padding: '2px 8px',
          borderRadius: '10px',
        }}>
          {badge}
        </span>
      )}
    </button>
  );
}
