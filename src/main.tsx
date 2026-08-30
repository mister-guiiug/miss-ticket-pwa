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
import { ThemePainter, SocleLabels } from './components/SocleProviders';
import { registerServiceWorker } from './register-sw';
import { applyTheme, readBootTheme, THEME_LEGACY_KEYS } from './styles/theme';

installErrorReporter();
void initSentry({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
});
registerServiceWorker();

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
                  <App />
                </IconsProvider>
              </SocleLabels>
            </ThemePainter>
          </ThemeProvider>
        </I18nProvider>
      </ErrorBoundary>
    </StrictMode>
  );
}
