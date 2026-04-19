import { useState, useEffect } from 'react';
import { useWindowSize } from '../hooks/useWindowSize';

export function ConnectionStatusIndicator({ isOnline }: { isOnline: boolean }) {
  const { isMobile } = useWindowSize();
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 10px',
        backgroundColor: isOnline ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        border: `1px solid ${isOnline ? '#4ade80' : '#ef4444'}`,
        borderRadius: '6px',
        fontSize: '12px',
        color: isOnline ? '#4ade80' : '#ef4444',
        cursor: 'pointer'
      }}>
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: isOnline ? '#4ade80' : '#ef4444',
          animation: isOnline ? 'pulse 2s infinite' : 'none'
        }} />
        <span style={{ display: isMobile ? 'none' : 'inline' }}>
          {isOnline ? 'En ligne' : 'Hors ligne'}
        </span>
      </div>

      {showTooltip && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: '8px',
          backgroundColor: 'var(--tooltip-bg, #2d2d44)',
          color: 'var(--text-primary, #e0e0e0)',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          whiteSpace: 'nowrap',
          zIndex: 300,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
        }}>
          {isOnline
            ? 'Connecté à Firestore et WebSocket'
            : 'Mode hors ligne - données mises en cache'}
          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
