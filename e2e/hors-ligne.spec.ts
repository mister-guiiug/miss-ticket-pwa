import { test, expect } from '@playwright/test';

/*
 * LA BUILD DE PRODUCTION, RECHARGÉE HORS LIGNE.
 *
 * Constaté le 05/11/2026 sur https://mister-guiiug.github.io/miss-ticket-pwa/ :
 * coupé du réseau, le site ne démarrait plus. Rolldown avait rangé React dans
 * `assets/sentry.js`, le morceau que le service worker tient VOLONTAIREMENT
 * hors du précache ; l'entrée commençait par `import{n}from"./sentry.js"`, et
 * sans ce fichier React ne montait pas. La passe axe-core tournait déjà sur la
 * build de `vite preview`, mais en ligne : elle ne pouvait pas le voir.
 *
 * La spec rejoue le geste de l'utilisateur : une visite en ligne installe le
 * worker, un rechargement le fait contrôler la page, puis la coupure, puis un
 * rechargement.
 *
 * LA COUPURE EST DOUBLE. `setOffline` seul laisse passer les requêtes du
 * service worker ; `context.route` refuse tout, y compris les siennes.
 *
 * LE TÉMOIN EST CE QUE SEUL REACT REND : le champ du pseudo, qui n'existe
 * qu'une fois l'état d'authentification connu. Aucune connexion n'est tentée —
 * elle ouvrirait un compte anonyme sur le projet Firebase de production.
 */
test.use({ locale: 'fr-FR' });

test.describe('@critical hors ligne', () => {
  test('la build de production se recharge sans réseau', async ({
    page,
    context,
    browserName,
  }) => {
    test.skip(
      browserName !== 'chromium',
      'Seul Chromium route les requêtes du service worker.'
    );
    test.slow();

    await page.goto('/');
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload();
    await expect
      .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
      .toBe(true);

    await context.setOffline(true);
    await context.route('**/*', route => route.abort('internetdisconnected'));
    await page.reload();

    await expect(
      page.getByRole('textbox', { name: 'Votre pseudo' })
    ).toBeVisible();
  });
});
