import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Monitor, Moon, Sun, X } from 'lucide-react';
import {
  ErrorBoundary,
  IconsProvider,
  ThemeProvider,
} from '@mister-guiiug/dev-wpa-config/react';
import { lucideIconSet } from '@mister-guiiug/dev-wpa-config/react/icons-lucide';
import {
  installErrorReporter,
  initSentry,
  recordError,
} from '@mister-guiiug/dev-wpa-config/react/observability';
import './index.css';
import App from './App';
import { I18nProvider } from './i18n';
import {
  ThemePainter,
  SocleLabels,
  OfflineBanner,
} from './components/SocleProviders';
import { registerSW } from 'virtual:pwa-register';
import { AppUpdates } from '@mister-guiiug/dev-wpa-config/react/app-updates';
import { unregisterServiceWorkers } from '@mister-guiiug/dev-wpa-config/sw-update';
import { applyTheme, readBootTheme, THEME_LEGACY_KEYS } from './styles/theme';

installErrorReporter();
void initSentry({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
});
/**
 * Service worker : coquille hors-ligne, en mode `prompt` (voir
 * `vite.config.ts`). La nouvelle version est téléchargée en fond ; le bandeau
 * du socle (`<AppUpdates>`, ci-dessous) propose de recharger et l'utilisateur
 * choisit le moment — avant le 02/09/2026, `autoUpdate` rechargeait en pleine
 * session. L'import est bundlé, pas de script en ligne : la CSP stricte le
 * refuserait.
 *
 * EN DÉVELOPPEMENT, on désinscrit d'abord : un worker resté d'une session
 * précédente sert du cache périmé pendant qu'on code, et le HMR se bat contre
 * lui. `unregisterServiceWorkers` vient du socle et corrige trois défauts de la
 * douzaine de lignes qu'il remplace — un `catch` PAR désinscription (le nôtre
 * ne couvrait que `getRegistrations()`, si bien qu'un `unregister()` en échec
 * devenait un `unhandledrejection`), un plafond de temps (`getRegistrations()`
 * peut bloquer plusieurs secondes sur iOS en mode autonome, ici sur le chemin
 * du démarrage), et un compte en retour au lieu d'un `void` inobservable.
 *
 * LA CONDITION RESTE ICI : le paquet est aussi lu par `node --test`, il ne peut
 * pas interroger `import.meta.env`.
 */
if (import.meta.env.DEV) {
  void unregisterServiceWorkers();
}

// Avant le premier rendu : les couleurs de l'app sont des variables CSS posées
// en ligne, elles n'existent pas tant que `applyTheme` n'a pas tourné. Sans cet
// appel, la première peinture se ferait sans aucune couleur.
applyTheme(readBootTheme());

/**
 * Miss Ticket dessine avec lucide-react : sans ce branchement, la bascule du
 * socle rendrait ses SVG maison, soit deux langages visuels dans le même
 * en-tête.
 */
const icons = lucideIconSet({
  close: X,
  light: Sun,
  dark: Moon,
  system: Monitor,
});

const rootElement = document.getElementById('app');

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary
        onError={error => {
          recordError(error, { source: 'error-boundary' });
        }}
      >
        <I18nProvider>
          {/* `defaultTheme` reste `dark` : Miss Ticket est une app sombre, et
              l'était déjà (`applyTheme('dark')` en tête d'App.tsx).
              `legacyKeys` reprend la préférence stockée sous `theme`. Pas
              d'appId : aucune palette --dwc-* n'est peinte. */}
          <ThemeProvider defaultTheme="dark" legacyKeys={THEME_LEGACY_KEYS}>
            <ThemePainter>
              <SocleLabels>
                <IconsProvider icons={icons}>
                  {/* Le bandeau hors-ligne est un FRÈRE d'`App`, pas un
                      descendant : `App` sort trois fois avant sa mise en page
                      (chargement, QR Tauri, connexion) et l'écran de connexion
                      est celui où la coupure fait le plus de dégâts. */}
                  <OfflineBanner />
                  <AppUpdates
                    registerSW={import.meta.env.PROD ? registerSW : undefined}
                  >
                    <App />
                  </AppUpdates>
                </IconsProvider>
              </SocleLabels>
            </ThemePainter>
          </ThemeProvider>
        </I18nProvider>
      </ErrorBoundary>
    </StrictMode>
  );
}
