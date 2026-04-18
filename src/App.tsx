/**
 * Composant principal de la PWA Miss Ticket
 */
import { createSignal, onMount, onCleanup } from 'solid-js';
import { getDesktopBridge, SessionState, DesktopBridge } from './lib/websocket';

function App() {
  const [connected, setConnected] = createSignal(false);
  const [sessions, setSessions] = createSignal<SessionState[]>([]);
  const [error, setError] = createSignal<string | null>(null);

  let bridge: DesktopBridge;

  onMount(() => {
    bridge = getDesktopBridge();

    bridge.connect().then(() => {
      setConnected(true);
      setError(null);
    }).catch(() => {
      setError('Impossible de se connecter à l\'application desktop');
    });

    const unsubscribeState = bridge.on('state', (msg) => {
      if (msg.sessions) setSessions(msg.sessions);
    });

    const unsubscribeUpdate = bridge.on('session_update', (msg) => {
      if (msg.data) {
        setSessions(prev => {
          const idx = prev.findIndex(s => s.instance_id === msg.data!.instance_id);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = msg.data!;
            return updated;
          }
          return [...prev, msg.data!];
        });
      }
    });

    const unsubscribeRemoved = bridge.on('session_removed', (msg) => {
      if (msg.instance_id) {
        setSessions(prev => prev.filter(s => s.instance_id !== msg.instance_id));
      }
    });

    onCleanup(() => {
      unsubscribeState();
      unsubscribeUpdate();
      unsubscribeRemoved();
      bridge.disconnect();
    });
  });

  return (
    <div style="min-height:100vh;background-color:#0f0f1a;color:#e0e0e0;padding:16px">
      <header style="margin-bottom:24px">
        <h1 style="color:#ff6b6b;margin:0">🎫 Miss Ticket</h1>
        <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
          <span style={`width:12px;height:12px;border-radius:50%;background-color:${connected() ? '#4ade80' : '#ef4444'}`} />
          <span style="font-size:14px">{connected() ? 'Connecté' : 'Déconnecté'}</span>
        </div>
      </header>

      {error() && (
        <div style="background-color:#7f1d1d;border:1px solid #dc2626;color:#fecaca;padding:16px;border-radius:8px;margin-bottom:16px">
          ⚠️ {error()}
        </div>
      )}

      {!connected() && !error() && (
        <div style="text-align:center;padding:32px">
          <div style="font-size:14px;color:#9ca3af">Connexion à l'application desktop...</div>
        </div>
      )}

      {connected() && (
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px">
          <div style="background-color:#1e1e2e;padding:16px;border-radius:8px;border:1px solid #2d2d44">
            <div style="font-size:24px;font-weight:bold">{sessions().length}</div>
            <div style="font-size:14px;color:#9ca3af">Sessions</div>
          </div>
          <div style="background-color:#1e1e2e;padding:16px;border-radius:8px;border:1px solid #2d2d44">
            <div style="font-size:24px;font-weight:bold;color:#fbbf24">
              {sessions().filter(s => s.status.includes('attente')).length}
            </div>
            <div style="font-size:14px;color:#9ca3af">En attente</div>
          </div>
          <div style="background-color:#1e1e2e;padding:16px;border-radius:8px;border:1px solid #2d2d44">
            <div style="font-size:24px;font-weight:bold;color:#60a5fa">
              {sessions().filter(s => s.status.includes('achat')).length}
            </div>
            <div style="font-size:14px;color:#9ca3af">Page d'achat</div>
          </div>
        </div>
      )}

      {connected() && (
        <div style="background-color:#1e1e2e;border-radius:8px;border:1px solid #2d2d44">
          <div style="padding:16px;border-bottom:1px solid #2d2d44">
            <h2 style="margin:0;font-size:16px">Sessions Actives</h2>
          </div>

          {sessions().length === 0 ? (
            <div style="padding:32px;text-align:center;color:#9ca3af">
              Aucune session active.
            </div>
          ) : (
            <div>
              {sessions().map(session => (
                <div key={session.instance_id} style="padding:16px;border-bottom:1px solid #2d2d44">
                  <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                    <span style="font-family:monospace;font-size:12px;color:#9ca3af">{session.instance_id}</span>
                    <span style="font-size:14px;color:{session.status.includes('Connecté') ? '#4ade80' : session.status.includes('attente') ? '#fbbf24' : session.status.includes('achat') ? '#60a5fa' : '#ef4444'}">
                      {session.status}
                    </span>
                  </div>
                  <div style="font-size:14px">{session.email}</div>
                  <div style="font-size:12px;color:#9ca3af;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{session.concert_url}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
