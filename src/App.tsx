/**
 * Composant principal de la PWA Miss Ticket avec Firebase
 */
import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useDesktops } from './hooks/useDesktops';
import { useSessions } from './hooks/useSessions';
import { LoginForm } from './components/LoginForm';
import { PairingDialog } from './components/PairingDialog';
import { DesktopList } from './components/DesktopList';
import { SessionPanel } from './components/SessionPanel';

type View = 'login' | 'desktops' | 'sessions';

function App() {
  const { user, loading: authLoading, signInWithPseudo } = useAuth();
  const [view, setView] = useState<View>('desktops');
  const [selectedDesktopId, setSelectedDesktopId] = useState<string | undefined>();
  const [showPairing, setShowPairing] = useState(false);

  const { desktops, loading: desktopsLoading } = useDesktops(user?.uid);
  const { sessions, loading: sessionsLoading } = useSessions(selectedDesktopId);

  // État d'authentification
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f0f1a',
        color: '#e0e0e0'
      }}>
        Chargement...
      </div>
    );
  }

  // Pas connecté -> Login
  if (!user) {
    return <LoginForm onLogin={signInWithPseudo} />;
  }

  // Dialog d'appariement
  if (showPairing) {
    return (
      <>
        <MainApp
          view={view}
          desktops={desktops}
          desktopsLoading={desktopsLoading}
          sessions={sessions}
          sessionsLoading={sessionsLoading}
          selectedDesktopId={selectedDesktopId}
          user={user}
          onViewChange={setView}
          onSelectDesktop={setSelectedDesktopId}
          onShowPairing={() => setShowPairing(true)}
        />
        <PairingDialog
          userId={user.uid}
          onPaired={() => setShowPairing(false)}
          onCancel={() => setShowPairing(false)}
        />
      </>
    );
  }

  return (
    <MainApp
      view={view}
      desktops={desktops}
      desktopsLoading={desktopsLoading}
      sessions={sessions}
      sessionsLoading={sessionsLoading}
      selectedDesktopId={selectedDesktopId}
      user={user}
      onViewChange={setView}
      onSelectDesktop={(id) => {
        setSelectedDesktopId(id);
        setView('sessions');
      }}
      onShowPairing={() => setShowPairing(true)}
    />
  );
}

interface MainAppProps {
  view: View;
  desktops: Array<{ id: string; name: string; online: boolean; lastSeen: Date; sessions: any[] }>;
  desktopsLoading: boolean;
  sessions: any[];
  sessionsLoading: boolean;
  selectedDesktopId: string | undefined;
  user: { displayName: string | null; uid: string };
  onViewChange: (view: View) => void;
  onSelectDesktop: (id: string) => void;
  onShowPairing: () => void;
}

function MainApp({
  view,
  desktops,
  desktopsLoading,
  sessions,
  sessionsLoading,
  selectedDesktopId,
  user,
  onViewChange,
  onSelectDesktop,
  onShowPairing
}: MainAppProps) {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f0f1a',
      color: '#e0e0e0',
      padding: '16px'
    }}>
      <header style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ color: '#ff6b6b', margin: 0 }}>
            🎫 Miss Ticket
          </h1>
          <div style={{ fontSize: '14px', color: '#9ca3af' }}>
            👤 {user.displayName || 'Anonyme'}
          </div>
        </div>
      </header>

      {view === 'desktops' && (
        <DesktopList
          desktops={desktops}
          loading={desktopsLoading}
          onSelectDesktop={onSelectDesktop}
          onPairNew={onShowPairing}
        />
      )}

      {view === 'sessions' && selectedDesktopId && (
        <SessionPanel
          desktopId={selectedDesktopId}
          userId={user.uid}
          sessions={sessions}
          loading={sessionsLoading}
          onBack={() => onViewChange('desktops')}
        />
      )}
    </div>
  );
}

export default App;
