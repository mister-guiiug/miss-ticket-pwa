import { useEffect, useRef } from 'react';

interface UserMenuProps {
  user: { displayName: string | null; uid: string };
  onSignOut: () => void;
  onClose: () => void;
}

export function UserMenu({ user, onSignOut, onClose }: UserMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: '8px',
        backgroundColor: 'var(--card-bg, #1e1e2e)',
        border: '1px solid var(--border-color, #2d2d44)',
        borderRadius: '8px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
        minWidth: '200px',
        overflow: 'hidden',
        zIndex: 200
      }}
    >
      {/* Info utilisateur */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid var(--border-color, #2d2d44)'
      }}>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary, #9ca3af)' }}>
          Connecté comme
        </div>
        <div style={{
          fontSize: '16px',
          fontWeight: 'bold',
          color: 'var(--text-primary, #e0e0e0)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {user.displayName || 'Anonyme'}
        </div>
        <div style={{
          fontSize: '11px',
          color: 'var(--text-secondary, #9ca3af)',
          fontFamily: 'monospace',
          marginTop: '4px'
        }}>
          ID: {user.uid.slice(-8)}
        </div>
      </div>

      {/* Actions */}
      <button
        onClick={() => {
          // TODO: Implémenter l'édition du pseudo
          console.log('Edit pseudo');
        }}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: 'none',
          border: 'none',
          color: 'var(--text-primary, #e0e0e0)',
          cursor: 'pointer',
          textAlign: 'left',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--hover-bg, #2d2d44)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        ✏️ Modifier le pseudo
      </button>

      <button
        onClick={() => {
          // TODO: Implémenter les paramètres
          console.log('Settings');
        }}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: 'none',
          border: 'none',
          color: 'var(--text-primary, #e0e0e0)',
          cursor: 'pointer',
          textAlign: 'left',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--hover-bg, #2d2d44)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        ⚙️ Paramètres
      </button>

      <div style={{
        borderTop: '1px solid var(--border-color, #2d2d44)',
        marginTop: '4px'
      }} />

      <button
        onClick={onSignOut}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: 'none',
          border: 'none',
          color: '#ef4444',
          cursor: 'pointer',
          textAlign: 'left',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        🚪 Déconnexion
      </button>
    </div>
  );
}
