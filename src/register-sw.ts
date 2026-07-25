import { registerSW } from 'virtual:pwa-register';

/**
 * Enregistre le service worker généré par vite-plugin-pwa (coquille hors-ligne),
 * en mode autoUpdate : la nouvelle version s'installe et s'active au prochain
 * chargement, sans invite. Import bundlé (pas de script inline → CSP stricte).
 *
 * En dev, on désenregistre tout SW résiduel pour éviter un cache périmé pendant
 * le HMR.
 */
export function registerServiceWorker(): void {
  if (import.meta.env.DEV) {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then(regs => regs.forEach(r => r.unregister()))
        .catch(() => {});
    }
    return;
  }
  registerSW({ immediate: true });
}
