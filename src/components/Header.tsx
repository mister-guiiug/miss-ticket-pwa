import { useState } from 'react';
import {
  Monitor,
  ChevronRight,
  User,
  Bell,
  RefreshCw,
  Plus,
  LogOut,
  Settings,
  Edit3,
  Menu,
  Moon,
  Sun,
  Zap
} from 'lucide-react';
import { UserMenu } from './UserMenu';
import { NotificationBadge } from './NotificationBadge';
import { ConnectionStatusIndicator } from './ConnectionStatusIndicator';
import { ThemeToggle } from './ThemeToggle';
import { MobileMenu } from './MobileMenu';
import { useWindowSize } from '../hooks/useWindowSize';

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
    <header className="glass" style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      borderBottom: '1px solid var(--header-border)',
      padding: isMobile ? '12px 16px' : '16px 20px',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        {/* Logo et breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
          {/* Logo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(244, 63, 94, 0.3)',
            }}>
              <Zap size={20} color="#ffffff" strokeWidth={2.5} />
            </div>
            {!isMobile && (
              <span style={{
                fontSize: '18px',
                fontWeight: '700',
                letterSpacing: '-0.5px',
                background: 'linear-gradient(135deg, var(--primary-400), var(--primary-600))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Miss Ticket
              </span>
            )}
          </div>

          {/* Breadcrumb de navigation */}
          {view !== 'login' && (
            <nav style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
            }}>
              <button
                onClick={() => onNavigate('desktops')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: view === 'desktops' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '6px 12px',
                  fontSize: '14px',
                  fontWeight: view === 'desktops' ? '600' : '500',
                  borderRadius: '6px',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onMouseEnter={(e) => {
                  if (view !== 'desktops') {
                    e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (view !== 'desktops') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <Monitor size={16} />
                <span>Desktops</span>
              </button>

              {view === 'sessions' && selectedDesktopName && (
                <>
                  <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />
                  <button
                    onClick={() => onNavigate('sessions')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      padding: '6px 12px',
                      fontSize: '14px',
                      fontWeight: '600',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: isMobile ? '80px' : '150px',
                    }}
                    title={selectedDesktopName}
                  >
                    {selectedDesktopName}
                  </button>
                </>
              )}
            </nav>
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
              ...baseButtonStyle,
              display: isMobile ? 'none' : 'flex',
            }}
            title="Rafraîchir"
          >
            <RefreshCw size={18} />
          </button>

          {/* Bouton appariement rapide */}
          {view === 'desktops' && !isMobile && (
            <button
              onClick={onShowPairing}
              style={{
                ...primaryButtonStyle,
                padding: '8px 16px',
                gap: '6px',
              }}
            >
              <Plus size={16} />
              <span>Apparier</span>
            </button>
          )}

          {/* Menu utilisateur */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary-500)';
                e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
              }}
            >
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--primary-400), var(--primary-600))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <User size={14} color="#ffffff" />
              </div>
              {!isMobile && (
                <>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'var(--text-primary)',
                    maxWidth: '100px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {user.displayName || 'Invité'}
                  </span>
                  <ChevronRight size={14} style={{
                    color: 'var(--text-tertiary)',
                    transform: showUserMenu ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  }} />
                </>
              )}
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
              ...baseButtonStyle,
              display: isMobile ? 'flex' : 'none',
            }}
          >
            <Menu size={22} />
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

// Styles réutilisables
const baseButtonStyle = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  padding: '8px',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s',
};

const primaryButtonStyle = {
  background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
  border: 'none',
  color: '#ffffff',
  cursor: 'pointer',
  borderRadius: '10px',
  fontSize: '14px',
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 12px rgba(244, 63, 94, 0.25)',
  transition: 'all 0.2s',
};

primaryButtonStyle as any;
