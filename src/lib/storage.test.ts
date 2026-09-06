import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  SETTINGS_VERSION,
  clearAppData,
  loadSettings,
  saveSettings,
} from './storage';

/**
 * CE QUE CE FICHIER ÉPROUVE — ET POURQUOI IL EXISTE AVANT LE CODE.
 *
 * Les réglages étaient écrits en `localStorage` NU (clé `settings`), sans
 * schéma ni version : la prochaine évolution du modèle n'avait aucun moyen de
 * lire l'ancien format autrement qu'en le devinant, et une valeur illisible
 * était remplacée sans trace. Ce test fige l'INSTANTANÉ des clés d'aujourd'hui
 * et exige qu'on y retrouve tout — c'est la preuve d'achèvement demandée.
 *
 * Il fige aussi deux choses que le magasin versionné du socle apporte et que
 * la clé nue n'avait pas :
 *  - la copie de côté AVANT toute transformation (`…backup-v0`) ;
 *  - un préfixe d'application. Les dix-neuf PWA de la famille sont servies
 *    depuis le MÊME domaine (`mister-guiiug.github.io`) et partagent donc un
 *    seul `localStorage` : une clé `settings` nue est une collision qui
 *    n'attend qu'une deuxième app pour se produire.
 */

/** L'instantané exact de ce qu'un utilisateur d'aujourd'hui a sur le disque. */
const LEGACY_SETTINGS = {
  notifications: 'important',
  soundEnabled: false,
  vibrationEnabled: true,
  // `theme` a traîné dans le blob des versions antérieures : le thème est
  // depuis passé au socle (`dwc_theme`). Il doit tomber, pas concurrencer.
  theme: 'dark',
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('migration 0 → 1 des réglages', () => {
  it('retrouve tout ce que la clé `settings` nue contenait', () => {
    localStorage.setItem('settings', JSON.stringify(LEGACY_SETTINGS));

    expect(loadSettings()).toEqual({
      notifications: 'important',
      soundEnabled: false,
      vibrationEnabled: true,
    });
  });

  it('écrit l’enveloppe versionnée sous la clé préfixée de l’app', () => {
    localStorage.setItem('settings', JSON.stringify(LEGACY_SETTINGS));
    loadSettings();

    const stored = localStorage.getItem('ticket_settings');
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored as string)).toEqual({
      v: SETTINGS_VERSION,
      data: {
        notifications: 'important',
        soundEnabled: false,
        vibrationEnabled: true,
      },
    });
  });

  it('garde une copie de côté avant de transformer, et n’efface pas la clé nue', () => {
    const raw = JSON.stringify(LEGACY_SETTINGS);
    localStorage.setItem('settings', raw);
    loadSettings();

    // Le filet du socle : ce qui a été migré reste lisible tel quel.
    expect(localStorage.getItem('ticket_settings.backup-v0')).toBe(raw);
    // Et la clé d'origine n'est pas détruite : un retour arrière de
    // déploiement retrouve l'app d'hier telle qu'elle l'avait laissée.
    expect(localStorage.getItem('settings')).toBe(raw);
  });

  it('ne rejoue pas la reprise une fois les réglages migrés', () => {
    localStorage.setItem('settings', JSON.stringify(LEGACY_SETTINGS));
    loadSettings();

    saveSettings({
      notifications: 'none',
      soundEnabled: true,
      vibrationEnabled: false,
    });
    // La clé nue vaut toujours l'ancien blob : si la reprise se rejouait, elle
    // écraserait le choix qu'on vient d'enregistrer.
    expect(loadSettings()).toEqual({
      notifications: 'none',
      soundEnabled: true,
      vibrationEnabled: false,
    });
  });

  it('complète un blob partiel au lieu de le jeter', () => {
    localStorage.setItem('settings', JSON.stringify({ soundEnabled: false }));

    expect(loadSettings()).toEqual({
      ...DEFAULT_SETTINGS,
      soundEnabled: false,
    });
  });

  it('sans rien sur le disque, rend les valeurs par défaut', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('met de côté une valeur illisible plutôt que de la perdre', () => {
    localStorage.setItem('ticket_settings', '{tronqué');

    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
    expect(localStorage.getItem('ticket_settings.backup-illisible')).toBe(
      '{tronqué'
    );
  });

  it('met de côté une version d’APRÈS sans y toucher', () => {
    // L'onglet resté ouvert sur la version suivante a écrit ; l'utilisateur
    // rouvre celle-ci. On n'y comprend rien, on ne jette rien.
    const future = JSON.stringify({ v: SETTINGS_VERSION + 1, data: { x: 1 } });
    localStorage.setItem('ticket_settings', future);

    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
    expect(localStorage.getItem('ticket_settings')).toBe(future);
    expect(
      localStorage.getItem(`ticket_settings.backup-v${SETTINGS_VERSION + 1}`)
    ).toBe(future);
  });
});

describe('« Effacer les données locales » n’efface que celles de cette app', () => {
  it('laisse intactes les clés des autres PWA de la famille', () => {
    // Même origine `mister-guiiug.github.io`, donc un seul `localStorage` :
    // le `localStorage.clear()` d'hier emportait les dix-huit autres apps.
    localStorage.setItem('miss-genius:data', '{"v":2}');
    localStorage.setItem('mb_data', '{"joueurs":[]}');
    localStorage.setItem('mfm_places', '[]');
    localStorage.setItem('dwc_theme', 'light');
    localStorage.setItem('ticket_locale', 'fr');
    saveSettings({
      notifications: 'none',
      soundEnabled: false,
      vibrationEnabled: false,
    });

    clearAppData();

    expect(localStorage.getItem('miss-genius:data')).toBe('{"v":2}');
    expect(localStorage.getItem('mb_data')).toBe('{"joueurs":[]}');
    expect(localStorage.getItem('mfm_places')).toBe('[]');
    // Le thème et la langue sont des préférences, pas des données : elles
    // survivent, comme l'intention d'origine le demandait.
    expect(localStorage.getItem('dwc_theme')).toBe('light');
    expect(localStorage.getItem('ticket_locale')).toBe('fr');
    expect(loadSettings()).toEqual({
      notifications: 'none',
      soundEnabled: false,
      vibrationEnabled: false,
    });
  });
});
