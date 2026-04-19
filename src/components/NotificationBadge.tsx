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
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '8px',
        fontSize: '18px',
        borderRadius: '8px',
        transition: 'background-color 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--hover-bg, #2d2d44)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
      title={count > 0 ? `${count} session${count > 1 ? 's' : ''} active${count > 1 ? 's' : ''}` : 'Sessions'}
    >
      💻

      {count > 0 && (
        <span style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          backgroundColor: 'var(--primary-color, #ff6b6b)',
          color: '#fff',
          fontSize: '10px',
          fontWeight: 'bold',
          minWidth: '16px',
          height: '16px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 4px'
        }}>
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
}
