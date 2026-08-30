import { useEffect, type ReactNode } from 'react';
import {
  LabelsProvider,
  useThemeContext,
} from '@mister-guiiug/dev-wpa-config/react';
import { useI18n } from '../i18n';
import { applyTheme } from '../styles/theme';

/**
 * Le pont entre l'état du socle et le peintre de l'app.
 *
 * `applyTheme` était appelé depuis TROIS endroits — `App.tsx` (en dur sur
 * `dark`), l'ancien `ThemeToggle` et `Settings` —, chacun avec son propre état
 * et sa propre écriture dans `localStorage`. Les deux derniers divergeaient dès
 * qu'on touchait à l'un sans l'autre. Il n'y a plus qu'un état, celui de
 * `ThemeProvider`, et qu'un appelant : celui-ci.
 *
 * Le socle écrit `data-theme` sur `<html>` ; les couleurs de Miss Ticket, elles,
 * sont une quarantaine de variables CSS posées en ligne. C'est ce que ce pont
 * traduit, et c'est la seule raison pour laquelle `applyTheme` reste local.
 */
export function ThemePainter({ children }: { children: ReactNode }) {
  const theme = useThemeContext();
  const resolved = theme?.resolved === 'light' ? 'light' : 'dark';

  useEffect(() => {
    applyTheme(resolved);
  }, [resolved]);

  return children;
}

/**
 * Les libellés des composants du socle suivent la langue de l'app. Sans ce
 * pont, le nom accessible de la bascule de thème resterait en français pour un
 * utilisateur anglophone.
 */
export function SocleLabels({ children }: { children: ReactNode }) {
  const { locale } = useI18n();
  return <LabelsProvider locale={locale}>{children}</LabelsProvider>;
}
