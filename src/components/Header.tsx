import { useState } from 'react';
import { useWindowSize } from '../hooks/useWindowSize';
import { UserMenu } from './UserMenu';
import { NotificationBadge } from './NotificationBadge';
import { ConnectionStatusIndicator } from './ConnectionStatusIndicator';
import { ThemeToggle } from './ThemeToggle';
import { MobileMenu } from './MobileMenu';

interface HeaderProps {
  user: { displayName: string | null; uid: string };
  view: 'login' | 'desktops' | 'sessions';
  selectedDesktopName?: string;
  sessionsCount: number;
  onNavigate: (view: 'desktops' | 'sessions') => void;
  onSignOut: () => void;
  onShowPairing: () => void;
  onRefresh: () => void;
  isOnline: boolean;
}

export function Header({
  user,
  view,
  selectedDesktopName,
  sessionsCount,
  onNavigate,
  onSignOut,
  onShowPairing,
  onRefresh,
  isOnline
}: HeaderProps) {
  const { isMobile, isTablet } = useWindowSize();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: 'var(--header-bg, #1a1a2e)',
      borderBottom: '1px solid var(--border-color, #2d2d44)',
      padding: '12px 16px',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        {/* Logo et breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
          <h1 style={{
            color: 'var(--primary-color, #ff6b6b)',
            margin: 0,
            fontSize: '20px',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🎫 <span style={{ display: isMobile ? 'none' : 'inline' }}>Miss Ticket</span>
          </h1>

          {/* Breadcrumb de navigation */}
          {view !== 'login' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              color: 'var(--text-secondary, #9ca3af)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              <button
                onClick={() => onNavigate('desktops')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: view === 'desktops' ? 'var(--text-primary, #e0e0e0)' : 'var(--text-secondary, #9ca3af)',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  fontSize: '14px',
                  fontWeight: view === 'desktops' ? 'bold' : 'normal'
                }}
              >
                Desktops
              </button>

              {view === 'sessions' && selectedDesktopName && (
                <>
                  <span style={{ color: 'var(--text-secondary, #9ca3af)' }}>››</span>
                  <button
                    onClick={() => onNavigate('sessions')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-primary, #e0e0e0)',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '150px'
                    }}
                    title={selectedDesktopName}
                  >
                    {selectedDesktopName}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Actions rapides - Desktop */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Indicateur de connexion */}
          <ConnectionStatusIndicator isOnline={isOnline} />

          {/* Toggle thème */}
          <ThemeToggle />

          {/* Badge notifications sessions */}
          <NotificationBadge count={sessionsCount} onClick={() => onNavigate(view === 'sessions' ? 'desktops' : 'sessions')} />

          {/* Bouton rafraîchir */}
          <button
            onClick={onRefresh}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary, #9ca3af)',
              cursor: 'pointer',
              padding: '8px',
              fontSize: '18px',
              borderRadius: '8px',
              transition: 'background-color 0.2s',
              display: isMobile ? 'none' : 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--hover-bg, #2d2d44)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Rafraîchir"
          >
            🔄
          </button>

          {/* Bouton appariement rapide */}
          {view === 'desktops' && (
            <button
              onClick={onShowPairing}
              style={{
                background: 'var(--primary-color, #ff6b6b)',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                padding: '8px 16px',
                fontSize: '14px',
                borderRadius: '8px',
                fontWeight: 'bold',
                display: isMobile ? 'none' : 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              + Apparier
            </button>
          )}

          {/* Menu utilisateur */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{
                background: 'var(--secondary-bg, #2d2d44)',
                border: '1px solid var(--border-color, #3d3d5c)',
                color: 'var(--text-primary, #e0e0e0)',
                cursor: 'pointer',
                padding: '8px 12px',
                fontSize: '14px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'border-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary-color, #ff6b6b)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color, #3d3d5c)';
              }}
            >
              <span>👤</span>
              <span style={{
                maxWidth: '100px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {user.displayName || 'Anonyme'}
              </span>
              <span>{showUserMenu ? '▲' : '▼'}</span>
            </button>

            {showUserMenu && (
              <UserMenu
                user={user}
                onSignOut={onSignOut}
                onClose={() => setShowUserMenu(false)}
              />
            )}
          </div>

          {/* Menu hamburger mobile */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-primary, #e0e0e0)',
              cursor: 'pointer',
              padding: '8px',
              fontSize: '20px',
              display: isMobile ? 'flex' : 'none',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ☰
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {showMobileMenu && (
        <MobileMenu
          view={view}
          sessionsCount={sessionsCount}
          onNavigate={onNavigate}
          onShowPairing={onShowPairing}
          onRefresh={onRefresh}
          onClose={() => setShowMobileMenu(false)}
        />
      )}
    </header>
  );
}
