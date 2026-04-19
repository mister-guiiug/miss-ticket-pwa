/**
 * Composant principal de la PWA Miss Ticket avec Firebase
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './hooks/useAuth';
import { useDesktops } from './hooks/useDesktops';
import { useSessions } from './hooks/useSessions';
import { useOnline } from './hooks/useOnline';
import { LoginForm } from './components/LoginForm';
import { PairingDialog } from './components/PairingDialog';
import { DesktopList } from './components/DesktopList';
import { SessionPanel } from './components/SessionPanel';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { NotificationContainer, Notification } from './components/NotificationToast';
import { FilterBar, DesktopFilter, SessionFilter, DesktopSort } from './components/FilterBar';
import { EditProfile } from './components/EditProfile';
import { Settings } from './components/Settings';
import { applyTheme } from './styles/theme';
import './styles/globals.css';

// Appliquer le thème par défaut au démarrage
applyTheme('dark');

type View = 'login' | 'desktops' | 'sessions';

function App() {
  const { user, loading: authLoading, signInWithPseudo, signOut } = useAuth();
  const [view, setView] = useState<View>('desktops');
  const [selectedDesktopId, setSelectedDesktopId] = useState<string | undefined>();
  const [selectedDesktopName, setSelectedDesktopName] = useState<string>('');
  const [showPairing, setShowPairing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [desktopFilter, setDesktopFilter] = useState<DesktopFilter>('all');
  const [sessionFilter, setSessionFilter] = useState<SessionFilter>('all');
  const [desktopSort, setDesktopSort] = useState<DesktopSort>('name');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const isOnline = useOnline();

  const { desktops, loading: desktopsLoading } = useDesktops(user?.uid);
  const { sessions, loading: sessionsLoading } = useSessions(selectedDesktopId);

  // Réinitialiser la recherche quand on change de vue
  useEffect(() => {
    setSearchQuery('');
  }, [view, selectedDesktopId]);

  // Compter le total des sessions actives pour le badge
  const totalSessionsCount = desktops.reduce(
    (sum, d) => sum + (d.sessions?.length || 0),
    0
  );

  // Système de notifications pour les changements de sessions
  const previousSessionsRef = useRef<string[]>([]);

  useEffect(() => {
    if (selectedDesktopId && sessions.length > 0) {
      const currentIds = sessions.map(s => s.instance_id);
      const previousIds = previousSessionsRef.current;

      // Nouvelles sessions
      sessions.forEach(session => {
        if (!previousIds.includes(session.instance_id)) {
          // Nouvelle session créée
          if (session.status.toLowerCase().includes('achat')) {
            addNotification({
              type: 'success',
              title: 'Page d\'achat atteinte !',
              message: `${session.email} a atteint la page d'achat pour ${session.concert_url.slice(0, 30)}...`
            });
          } else if (session.status.toLowerCase().includes('attente')) {
            addNotification({
              type: 'info',
              title: 'Nouvelle session en attente',
              message: `${session.email} est dans la file d'attente${session.queue_position ? ` (position: ${session.queue_position})` : ''}`
            });
          }
        } else {
          // Session existante - vérifier les changements de statut
          const previousSession = previousSessionsRef.current.includes(session.instance_id)
            ? sessions.find(s => s.instance_id === session.instance_id)
            : null;

          if (previousSession && previousSession.status !== session.status) {
            if (session.status.toLowerCase().includes('achat') && !previousSession.status.toLowerCase().includes('achat')) {
              addNotification({
                type: 'success',
                title: 'Page d\'achat atteinte !',
                message: `${session.email} a atteint la page d'achat !`
              });
            } else if (session.status.toLowerCase().includes('erreur')) {
              addNotification({
                type: 'error',
                title: 'Erreur de session',
                message: `${session.email} a rencontré une erreur`
              });
            }
          }
        }
      });

      previousSessionsRef.current = currentIds;
    }
  }, [sessions, selectedDesktopId]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const id = `${Date.now()}-${Math.random()}`;
    setNotifications(prev => [...prev, { ...notification, id, timestamp: Date.now() }]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    addNotification({
      type: 'info',
      title: 'Rafraîchissement',
      message: 'Données mises à jour'
    });
  }, [addNotification]);

  const handleNavigate = useCallback((newView: View) => {
    if (newView === 'desktops') {
      setSelectedDesktopId(undefined);
      setSelectedDesktopName('');
    }
    setView(newView);
  }, []);

  const handleSelectDesktop = useCallback((desktopId: string) => {
    const desktop = desktops.find(d => d.id === desktopId);
    if (desktop) {
      setSelectedDesktopId(desktopId);
      setSelectedDesktopName(desktop.name);
      setView('sessions');
    }
  }, [desktops]);

  const handleProfileSaved = useCallback((newPseudo: string) => {
    setShowEditProfile(false);
    addNotification({
      type: 'success',
      title: 'Profil mis à jour',
      message: `Votre pseudo est maintenant ${newPseudo}`
    });
    // Force refresh to update the user display name
    window.location.reload();
  }, [addNotification]);

  // État d'authentification
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--main-bg, #0f0f1a)',
        color: 'var(--text-primary, #e0e0e0)'
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
          selectedDesktopName={selectedDesktopName}
          user={user}
          searchQuery={searchQuery}
          desktopFilter={desktopFilter}
          sessionFilter={sessionFilter}
          desktopSort={desktopSort}
          totalSessionsCount={totalSessionsCount}
          isOnline={isOnline}
          onNavigate={handleNavigate}
          onSelectDesktop={handleSelectDesktop}
          onShowPairing={() => setShowPairing(true)}
          onRefresh={handleRefresh}
          onSearchChange={setSearchQuery}
          onDesktopFilterChange={setDesktopFilter}
          onSessionFilterChange={setSessionFilter}
          onDesktopSortChange={setDesktopSort}
          onSignOut={signOut}
          onEditProfile={() => setShowEditProfile(true)}
          onOpenSettings={() => setShowSettings(true)}
        />
        <PairingDialog
          userId={user.uid}
          onPaired={() => {
            setShowPairing(false);
            addNotification({
              type: 'success',
              title: 'Appariement réussi',
              message: 'Le desktop a été appairé avec succès'
            });
          }}
          onCancel={() => setShowPairing(false)}
        />
      </>
    );
  }

  return (
    <>
      <MainApp
        view={view}
        desktops={desktops}
        desktopsLoading={desktopsLoading}
        sessions={sessions}
        sessionsLoading={sessionsLoading}
        selectedDesktopId={selectedDesktopId}
        selectedDesktopName={selectedDesktopName}
        user={user}
        searchQuery={searchQuery}
        desktopFilter={desktopFilter}
        sessionFilter={sessionFilter}
        desktopSort={desktopSort}
        totalSessionsCount={totalSessionsCount}
        isOnline={isOnline}
        onNavigate={handleNavigate}
        onSelectDesktop={handleSelectDesktop}
        onShowPairing={() => setShowPairing(true)}
        onRefresh={handleRefresh}
        onSearchChange={setSearchQuery}
        onDesktopFilterChange={setDesktopFilter}
        onSessionFilterChange={setSessionFilter}
        onDesktopSortChange={setDesktopSort}
        onSignOut={signOut}
        onEditProfile={() => setShowEditProfile(true)}
        onOpenSettings={() => setShowSettings(true)}
      />
      <NotificationContainer notifications={notifications} onClose={removeNotification} />

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <EditProfile
          currentPseudo={user.displayName || ''}
          onSave={handleProfileSaved}
          onCancel={() => setShowEditProfile(false)}
        />
      )}

      {/* Settings Screen */}
      {showSettings && (
        <Settings
          user={user}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
}

interface MainAppProps {
  view: View;
  desktops: Array<{ id: string; name: string; online: boolean; lastSeen: Date; sessions: any[] }>;
  desktopsLoading: boolean;
  sessions: any[];
  sessionsLoading: boolean;
  selectedDesktopId: string | undefined;
  selectedDesktopName: string;
  user: { displayName: string | null; uid: string };
  searchQuery: string;
  desktopFilter: DesktopFilter;
  sessionFilter: SessionFilter;
  desktopSort: DesktopSort;
  totalSessionsCount: number;
  isOnline: boolean;
  onNavigate: (view: View) => void;
  onSelectDesktop: (id: string) => void;
  onShowPairing: () => void;
  onRefresh: () => void;
  onSearchChange: (query: string) => void;
  onDesktopFilterChange: (filter: DesktopFilter) => void;
  onSessionFilterChange: (filter: SessionFilter) => void;
  onDesktopSortChange: (sort: DesktopSort) => void;
  onSignOut: () => void;
  onEditProfile: () => void;
  onOpenSettings: () => void;
}

function MainApp({
  view,
  desktops,
  desktopsLoading,
  sessions,
  sessionsLoading,
  selectedDesktopId,
  selectedDesktopName,
  user,
  searchQuery,
  desktopFilter,
  sessionFilter,
  desktopSort,
  totalSessionsCount,
  isOnline,
  onNavigate,
  onSelectDesktop,
  onShowPairing,
  onRefresh,
  onSearchChange,
  onDesktopFilterChange,
  onSessionFilterChange,
  onDesktopSortChange,
  onSignOut,
  onEditProfile,
  onOpenSettings
}: MainAppProps) {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--main-bg, #0f0f1a)',
      color: 'var(--text-primary, #e0e0e0)'
    }}>
      <Header
        user={user}
        view={view}
        selectedDesktopName={selectedDesktopName}
        sessionsCount={totalSessionsCount}
        onNavigate={onNavigate}
        onSignOut={onSignOut}
        onShowPairing={onShowPairing}
        onRefresh={onRefresh}
        isOnline={isOnline}
        onEditProfile={onEditProfile}
        onOpenSettings={onOpenSettings}
      />

      <div style={{ padding: '16px' }}>
        {/* Barre de recherche et filtres */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            placeholder={view === 'desktops' ? 'Rechercher un desktop...' : 'Rechercher une session...'}
          />

          {view === 'desktops' && (
            <FilterBar
              type="desktop"
              filter={desktopFilter}
              sort={desktopSort}
              onFilterChange={onDesktopFilterChange}
              onSortChange={onDesktopSortChange}
            />
          )}

          {view === 'sessions' && (
            <FilterBar
              type="session"
              filter={sessionFilter}
              sort={desktopSort}
              onFilterChange={onSessionFilterChange}
              onSortChange={onDesktopSortChange}
            />
          )}
        </div>

        {/* Contenu principal */}
        {view === 'desktops' && (
          <DesktopList
            desktops={desktops}
            loading={desktopsLoading}
            onSelectDesktop={onSelectDesktop}
            onPairNew={onShowPairing}
            searchQuery={searchQuery}
            filter={desktopFilter}
            sortBy={desktopSort}
          />
        )}

        {view === 'sessions' && selectedDesktopId && (
          <SessionPanel
            desktopId={selectedDesktopId}
            desktopName={selectedDesktopName}
            userId={user.uid}
            sessions={sessions}
            loading={sessionsLoading}
            searchQuery={searchQuery}
            filter={sessionFilter}
          />
        )}
      </div>
    </div>
  );
}

export default App;
