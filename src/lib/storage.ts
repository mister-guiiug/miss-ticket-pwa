/**
 * La persistance locale de Miss Ticket : un magasin PRÉFIXÉ et VERSIONNÉ.
 *
 * CE QUI EXISTAIT, ET CE QU'IL COÛTAIT. Les réglages vivaient sous une clé
 * `settings` NUE, écrite par un `JSON.stringify` direct dans `Settings.tsx` —
 * sans version, sans schéma, sans filet. Trois conséquences mesurées :
 *
 *  1. **Aucune évolution possible sans deviner.** Le blob portait déjà un
 *     champ `theme` mort (le thème est passé au socle, clé `dwc_theme`) que le
 *     composant devait retirer à la lecture, à la main. Le prochain champ
 *     retiré ou renommé aurait demandé la même rustine, au même endroit, sans
 *     jamais rien de nommé « migration ».
 *  2. **Une collision qui n'attend qu'une deuxième app.** Les dix-neuf PWA de
 *     la famille sont servies depuis `mister-guiiug.github.io` : une seule
 *     origine, donc un seul `localStorage`. `settings` est le nom le plus
 *     banal qui soit. Aucune autre app du parc ne l'écrit AUJOURD'HUI — la
 *     collision est latente, pas constatée ; le préfixe `ticket_` (celui que
 *     `ticket_locale` porte déjà) la ferme avant qu'elle n'arrive.
 *  3. **Une destruction silencieuse.** Une valeur illisible (onglet tué au
 *     milieu d'une écriture, format d'une version d'après) était simplement
 *     remplacée à la sauvegarde suivante. Le magasin du socle copie de côté
 *     AVANT toute perte possible — jamais l'inverse.
 *
 * REPRISE DE L'EXISTANT (le « 0 → 1 »). La clé nue est recopiée telle quelle
 * sous `ticket_settings` la première fois, où le socle la voit sans enveloppe,
 * donc en version 0, et lui applique `migrations[0]`. La clé nue N'EST PAS
 * effacée : un retour arrière de déploiement doit retrouver l'app d'hier telle
 * qu'elle l'avait laissée.
 *
 * Motif : `miss-genius/src/shared/lib/storage.ts`, à ceci près que miss-genius
 * était DÉJÀ préfixée et pouvait garder sa clé historique.
 */
import { createStore, readRaw } from '@mister-guiiug/dev-pwa-config/storage';
import { createVersionedStore } from '@mister-guiiug/dev-pwa-config/versioned-store';

/**
 * Le magasin de l'app. `ticket_` : le préfixe que `ticket_locale` porte déjà,
 * pour que « les données de Miss Ticket » soient une notion qu'on puisse
 * énumérer — et donc effacer sans toucher aux dix-huit autres.
 */
export const appStore = createStore('ticket_');

export type NotificationPreference = 'all' | 'important' | 'none';

export interface SettingsState {
  notifications: NotificationPreference;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export const DEFAULT_SETTINGS: SettingsState = {
  notifications: 'all',
  soundEnabled: true,
  vibrationEnabled: true,
};

/** Version courante du schéma des réglages. */
export const SETTINGS_VERSION = 1;

/** Clé des réglages DANS le magasin (donc `ticket_settings` sur le disque). */
const SETTINGS_KEY = 'settings';

/** La clé nue d'avant, laissée en place et lue une seule fois. */
const LEGACY_SETTINGS_KEY = 'settings';

const NOTIFICATION_PREFERENCES: readonly NotificationPreference[] = [
  'all',
  'important',
  'none',
];

function asPreference(value: unknown): NotificationPreference {
  return NOTIFICATION_PREFERENCES.includes(value as NotificationPreference)
    ? (value as NotificationPreference)
    : DEFAULT_SETTINGS.notifications;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/**
 * Ramène n'importe quel blob à la forme courante : champ inconnu ignoré, champ
 * absent complété par son défaut.
 *
 * RÉPARER PLUTÔT QUE JETER, ici et seulement ici : un réglage manquant a une
 * valeur par défaut évidente, alors qu'un historique tronqué n'en a pas. Lever
 * ferait tomber le blob entier dans une copie de côté et rendrait les défauts
 * — l'utilisateur perdrait les trois réglages pour un champ ajouté.
 */
function normalizeSettings(value: unknown): SettingsState {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError('réglages : objet attendu');
  }
  const raw = value as Record<string, unknown>;
  return {
    notifications: asPreference(raw.notifications),
    soundEnabled: asBoolean(raw.soundEnabled, DEFAULT_SETTINGS.soundEnabled),
    vibrationEnabled: asBoolean(
      raw.vibrationEnabled,
      DEFAULT_SETTINGS.vibrationEnabled
    ),
  };
}

const settingsStore = createVersionedStore<SettingsState>({
  store: appStore,
  key: SETTINGS_KEY,
  version: SETTINGS_VERSION,
  migrations: {
    /**
     * 0 → 1 : le blob nu d'hier. On laisse tomber le `theme` mort et on
     * complète ce qui manque — c'est exactement ce que `Settings.tsx` faisait
     * à la main, désormais nommé, daté et éprouvé.
     */
    0: (data: unknown) => normalizeSettings(data),
  },
  validate: normalizeSettings,
  seed: () => ({ ...DEFAULT_SETTINGS }),
});

/**
 * Recopie la clé nue sous la clé préfixée, UNE fois. Paresseuse (appelée au
 * premier chargement) plutôt qu'au chargement du module : un effet de bord à
 * l'import se déclenche à des moments qu'aucun test ne contrôle.
 */
function adoptLegacySettings(): void {
  if (appStore.getRaw(SETTINGS_KEY) !== null) return;
  const legacy = readRaw(LEGACY_SETTINGS_KEY);
  if (legacy === null) return;
  appStore.setRaw(SETTINGS_KEY, legacy);
}

/** Les réglages : repris, migrés, validés. Jamais d'exception. */
export function loadSettings(): SettingsState {
  adoptLegacySettings();
  return settingsStore.load();
}

/** Enregistre les réglages sous leur enveloppe versionnée. */
export function saveSettings(settings: SettingsState): boolean {
  return settingsStore.save(settings);
}

/**
 * Une préférence — ce que « effacer les données » ne doit PAS emporter. Le
 * thème (`dwc_theme`) est hors préfixe, il ne passe donc pas par ici.
 */
function isPreference(key: string): boolean {
  return (
    key === 'locale' ||
    key === SETTINGS_KEY ||
    key.startsWith(`${SETTINGS_KEY}.`)
  );
}

/**
 * Efface les données locales de CETTE app — et d'elle seule.
 *
 * `localStorage.clear()`, qui vivait dans `Settings.tsx`, effaçait l'origine
 * ENTIÈRE : sur `mister-guiiug.github.io`, « effacer les données de Miss
 * Ticket » emportait les données des dix-huit autres PWA de la famille. Le
 * code restaurait ensuite `dwc_theme` et `settings` — les deux seules clés
 * qu'il connaissait — et laissait tomber tout le reste, à commencer par la
 * langue. Ici on n'énumère que les clés du préfixe, et on garde les
 * préférences.
 */
export function clearAppData(): void {
  for (const key of appStore.keys()) {
    if (isPreference(key)) continue;
    appStore.remove(key);
  }
}
