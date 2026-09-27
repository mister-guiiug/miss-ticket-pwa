---
title: Télécommander Miss Ticket depuis le téléphone
description: Relier un téléphone à Miss Ticket desktop pour piloter une session à distance : jumelage, gestes utiles et limites de la télécommande PWA.
---

# Télécommander Miss Ticket depuis le téléphone

Miss Ticket est une application **desktop**. La PWA Miss Ticket n'est pas un second client autonome : c'est une **télécommande** installable sur le téléphone, jumelée à la session déjà ouverte sur l'ordinateur.

## À quoi ça sert

Quand la file ou l'écran principal occupe le poste, le téléphone permet d'agir sans quitter ce contexte : valider un geste, confirmer une étape, relancer une action déjà prévue dans Miss Ticket. L'ordinateur reste la source de vérité ; le mobile ne stocke pas la session à sa place.

## Comment jumeler

1. Ouvrez Miss Ticket sur le desktop et lancez le jumelage (QR code ou code court, selon la version).
2. Sur le téléphone, ouvrez [Miss Ticket PWA](https://mister-guiiug.github.io/miss-ticket-pwa/) et scannez ou saisissez le code.
3. Une fois la liaison établie, les gestes du téléphone sont relayés vers la session desktop.

Le jumelage expire si la session desktop se ferme ou si le réseau coupe trop longtemps : il faudra alors recommencer.

## Ce que la télécommande ne fait pas

- Elle **ne remplace pas** l'application desktop.
- Elle ne contourne **aucune** file d'attente tierce : elle pilote uniquement Miss Ticket.
- Elle ne conserve pas d'identifiants de sites marchands : le couple téléphone / desktop reste dans le périmètre de Miss Ticket.

## Questions fréquentes

### Faut-il installer la PWA ?

Non. Le navigateur mobile suffit. L'installation (Ajouter à l'écran d'accueil) évite de retaper l'URL et garde la télécommande à portée.

### Le téléphone et l'ordinateur doivent-ils être sur le même Wi-Fi ?

En général oui pour un jumelage local stable. Si Miss Ticket propose un relais distant, suivez l'indication affichée dans l'app desktop au moment du jumelage.

### Que se passe-t-il si je recharge la page mobile ?

La liaison peut se perdre. Rouvrez le jumelage depuis le desktop, puis reconnectez le téléphone.
