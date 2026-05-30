import { useWindowSize } from '../hooks/useWindowSize';
import { Wifi, WifiOff } from 'lucide-react';

export function ConnectionStatusIndicator({ isOnline }: { isOnline: boolean }) {
  const { isMobile } = useWindowSize();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 10px',
        backgroundColor: isOnline ? 'var(--success-bg)' : 'var(--error-bg)',
        border: `1px solid ${
          isOnline ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'
        }`,
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      title={
        isOnline
          ? 'Connecté à Firestore et WebSocket'
          : 'Mode hors ligne - données mises en cache'
      }
    >
      <div
        style={{
          position: 'relative',
        }}
      >
        {isOnline ? (
          <Wifi size={14} style={{ color: 'var(--success)' }} />
        ) : (
          <WifiOff size={14} style={{ color: 'var(--error)' }} />
        )}
        {isOnline && (
          <div
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--success)',
              animation: 'pulse 2s infinite',
            }}
          />
        )}
      </div>
      {!isMobile && (
        <span style={{ color: isOnline ? 'var(--success)' : 'var(--error)' }}>
          {isOnline ? 'En ligne' : 'Hors ligne'}
        </span>
      )}
    </div>
  );
}
