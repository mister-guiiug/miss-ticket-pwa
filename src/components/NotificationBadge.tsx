import { Monitor } from 'lucide-react';

interface NotificationBadgeProps {
  count: number;
  onClick: () => void;
}

export function NotificationBadge({ count, onClick }: NotificationBadgeProps) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '8px',
        borderRadius: '8px',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
      title={count > 0 ? `${count} session${count > 1 ? 's' : ''} active${count > 1 ? 's' : ''}` : 'Sessions'}
    >
      <Monitor size={20} style={{ color: 'var(--text-secondary)' }} />

      {count > 0 && (
        <span style={{
          position: 'absolute',
          top: '6px',
          right: '6px',
          backgroundColor: 'var(--primary-500)',
          color: '#ffffff',
          fontSize: '10px',
          fontWeight: '700',
          minWidth: '16px',
          height: '16px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 4px',
          boxShadow: '0 2px 8px rgba(244, 63, 94, 0.4)',
        }}>
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
}
