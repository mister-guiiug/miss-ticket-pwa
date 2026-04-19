import { useEffect, useRef } from 'react';
import { User, Edit3, Settings, LogOut, Copy } from 'lucide-react';

interface UserMenuProps {
  user: { displayName: string | null; uid: string };
  onSignOut: () => void;
  onClose: () => void;
  onEditProfile?: () => void;
  onOpenSettings?: () => void;
}

export function UserMenu({ user, onSignOut, onClose, onEditProfile, onOpenSettings }: UserMenuProps) {
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

  const copyUserId = () => {
    navigator.clipboard.writeText(user.uid);
    // TODO: Show toast notification
  };

  return (
    <div
      ref={menuRef}
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        minWidth: '240px',
        overflow: 'hidden',
        zIndex: 200,
        animation: 'slideDown 0.2s ease-out',
      }}
    >
      {/* Profile Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'linear-gradient(180deg, var(--bg-elevated), var(--bg-card))',
      }}>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
          Connecté en tant que
        </div>
        <div style={{
          fontSize: '15px',
          fontWeight: '600',
          color: 'var(--text-primary)',
          marginBottom: '6px',
        }}>
          {user.displayName || 'Invité'}
        </div>
        <button
          onClick={copyUserId}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            color: 'var(--text-tertiary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-tertiary)';
          }}
        >
          <span>{user.uid.slice(-8)}</span>
          <Copy size={10} />
        </button>
      </div>

      {/* Actions */}
      <div style={{ padding: '4px' }}>
        <MenuButton
          icon={<Edit3 size={16} />}
          label="Modifier le profil"
          onClick={() => {
            onClose();
            onEditProfile?.();
          }}
        />

        <MenuButton
          icon={<Settings size={16} />}
          label="Paramètres"
          onClick={() => {
            onClose();
            onOpenSettings?.();
          }}
        />

        <div style={{
          height: '1px',
          backgroundColor: 'var(--border-subtle)',
          margin: '4px 0',
        }} />

        <MenuButton
          icon={<LogOut size={16} />}
          label="Déconnexion"
          onClick={onSignOut}
          destructive
        />
      </div>
    </div>
  );
}

interface MenuButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}

function MenuButton({ icon, label, onClick, destructive = false }: MenuButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 12px',
        backgroundColor: 'transparent',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        color: destructive ? 'var(--error)' : 'var(--text-primary)',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = destructive
          ? 'var(--error-bg)'
          : 'var(--bg-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
