// Suite a11y (axe-core + Playwright) — partie du gabarit dev-pwa-config.
// Le tag @a11y permet de filtrer : `playwright test --grep @a11y`.
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { expectNoA11yViolations } from '@mister-guiiug/dev-pwa-config/playwright-a11y';

// La langue est fixée : le Chrome de Playwright parle anglais, et l'app suit
// `navigator.language` tant que rien n'est stocké.
test.use({ locale: 'fr-FR' });

/**
 * AXE N'AUDITE QUE L'ÉCRAN QU'ON A ATTENDU.
 *
 * Le gabarit lançait axe dès `page.goto('/')`, c'est-à-dire au `load`. Or à
 * cet instant Firebase n'a pas encore dit si une session existe, et l'app
 * n'affiche que « Chargement... ». Mesuré le 24/09/2026 : cinq ouvertures sur
 * cinq, pas de h1, pas de champ. La passe axe du gabarit, verte en CI depuis
 * le 19/09 (1 test, 686 ms), n'a donc jamais vu l'écran de connexion.
 *
 * Le champ pseudo n'existe qu'une fois l'état d'authentification connu :
 * l'attendre, c'est refuser d'auditer autre chose que l'écran réel. Une page
 * sans React (le bloc statique servi aux robots) échoue de même ici.
 */
async function ouvrirConnexion(page: Page) {
  await page.goto('/');
  await expect(
    page.getByRole('textbox', { name: 'Votre pseudo' })
  ).toBeVisible();
}

/**
 * LES DEUX THÈMES, et chacun vérifié peint. L'app s'ouvre en sombre faute de
 * choix stocké (`readBootTheme`) : sans la clé, le clair ne serait jamais vu.
 * Le fond relu sur `<html>` prouve que c'est bien ce thème qu'axe mesure.
 */
const THEMES = [
  { cle: 'dark', nom: 'sombre', fond: '#0a0a0a' },
  { cle: 'light', nom: 'clair', fond: '#ffffff' },
] as const;

test.describe('@a11y accessibilité', () => {
  for (const { cle, nom, fond } of THEMES) {
    test(`écran de connexion sans violation WCAG A/AA, thème ${nom}`, async ({
      page,
    }) => {
      await page.addInitScript(theme => {
        localStorage.setItem('dwc_theme', theme);
      }, cle);
      await ouvrirConnexion(page);
      await expect
        .poll(() =>
          page.evaluate(() =>
            document.documentElement.style.getPropertyValue('--bg-primary')
          )
        )
        .toBe(fond);
      await expectNoA11yViolations(page, AxeBuilder, expect);
    });
  }
});
