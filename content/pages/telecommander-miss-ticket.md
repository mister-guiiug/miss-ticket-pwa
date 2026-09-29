---
title: Télécommander Miss Ticket depuis le téléphone : mode d'emploi
description: Relier un téléphone à Miss Ticket desktop pour suivre et arrêter ses sessions : jumelage par QR code, historique local, limites, et l'état actuel du lien.
date: 2026-09-27
updated: 2026-09-29
answer: La PWA Miss Ticket est la télécommande de Miss Ticket desktop. Après un jumelage par QR code, elle affiche les postes et leurs sessions et peut en arrêter une, ou toutes. Elle ne lance ni n'achète rien. Depuis le 21 mai 2026, le desktop ne se connecte plus au service qui les relie, donc le jumelage n'aboutit pas.
---

# Télécommander Miss Ticket depuis le téléphone

Miss Ticket est une application **desktop**. La PWA Miss Ticket n'est pas un second client autonome : c'est une **télécommande** installable sur le téléphone, jumelée au poste. L'ordinateur conduit les sessions ; le mobile les suit et peut les arrêter, sans quitter la file ou l'écran principal du poste.

## L'état actuel du lien avec le desktop

Depuis le 21 mai 2026, Miss Ticket desktop, dans son code actuel, ne se connecte plus à Firestore, le service de Google qui relie les deux applications, et n'affiche plus de QR code de jumelage. Tant que ce lien n'est pas rétabli, la télécommande ne peut ni se jumeler ni commander un poste. La suite décrit son fonctionnement quand le lien existe.

## À quoi ça sert

Quand la file ou l'écran principal occupe le poste, le téléphone permet d'agir sans se pencher sur le clavier : vérifier où en sont les sessions, en arrêter une, ou les arrêter toutes d'un coup. L'ordinateur reste la source de vérité. Le mobile ne stocke pas la session à sa place et ne remplace pas Miss Ticket desktop.

Cas d'usage typiques :

- vous êtes debout près de l'entrée ou de la file, téléphone en main, pendant que le poste tourne sur le bureau ;
- vous voulez surveiller plusieurs postes appairés sans ouvrir chacun d'eux ;
- vous devez arrêter une session rapidement sans toucher à la souris du desktop.

## Comment jumeler

1. Ouvrez Miss Ticket sur le desktop et lancez l'appairage : un QR code s'affiche.
2. Sur le téléphone, ouvrez [Miss Ticket](https://mister-guiiug.github.io/miss-ticket-pwa/), choisissez un pseudo, puis **Appairer un desktop**.
3. Scannez le QR code avec la caméra. L'écran propose aussi de saisir un code à six chiffres, mais cette voie n'aboutit pas encore : l'application renvoie vers le QR code.
4. Une fois la liaison établie, le desktop apparaît dans la liste **Desktops** de la télécommande.

Le jumelage passe par un jeton d'appairage à durée limitée, fixée par le desktop. Un QR code périmé ou déjà utilisé est refusé : il faut en afficher un nouveau sur le poste.

## Ce que la télécommande peut faire

Une fois le poste appairé, [Miss Ticket](https://mister-guiiug.github.io/miss-ticket-pwa/) expose trois écrans utiles :

- **Desktops** : la liste des postes appairés, avec le nombre de sessions en cours et un indicateur de connexion.
- **Sessions** : pour un poste donné, le détail des sessions actives (connectées, en attente, page d'achat atteinte) et deux actions : arrêter une session, ou **Arrêter tout**.
- **Historique** : les sessions terminées **telles que la télécommande les a vues** pendant qu'elle était ouverte : issue constatée (page d'achat atteinte, échec, arrêt demandé, fin subie), position finale dans la file, poste et concert.

Les commandes d'arrêt partent vers le desktop. Le desktop exécute et republie son état ; la PWA l'observe en temps réel. Hors ligne, aucune commande n'aboutit : un bandeau le dit, pour éviter de croire qu'un arrêt a bien été envoyé.

## Ce que la télécommande ne fait pas

- Elle **ne remplace pas** l'application desktop : sans Miss Ticket ouvert sur le poste, il n'y a rien à piloter.
- Elle **ne lance aucune session** : le protocole le prévoit, mais aucun écran ne l'envoie.
- Elle ne contourne **aucune** file d'attente tierce : elle pilote uniquement Miss Ticket.
- Elle ne transmet aucun mot de passe de site de billetterie. Son historique garde en revanche, sur le téléphone, l'adresse e-mail du compte utilisé par chaque session et l'adresse du concert.
- Elle n'est **pas** une seconde source de vérité pour l'issue des sessions : l'historique ne retient que ce que la PWA a observé pendant qu'elle était ouverte. Il reste sur l'appareil (`localStorage`), ne suit pas d'un téléphone à l'autre, et disparaît si vous effacez les données locales.
- Elle ne reçoit pas de notification poussée quand une session se termine hors de l'écran : pour voir une issue, la télécommande doit être ouverte au moment où la session s'arrête.

## Limites utiles à connaître

- **Réseau** : le jumelage et les commandes passent par Firestore, un service en ligne. Le téléphone et le poste ont besoin d'Internet, pas d'être sur le même Wi-Fi.
- **Rechargement de la page mobile** : la connexion anonyme n'est gardée qu'en mémoire. Après un rechargement, il faut rechoisir un pseudo, ce qui crée un nouveau compte anonyme, puis jumeler de nouveau ses postes.
- **Plusieurs desktops** : vous pouvez appairer plusieurs postes sur le même téléphone ; chaque commande cible le desktop choisi dans la liste.
- **Installation PWA** : facultative. « Ajouter à l'écran d'accueil » évite de retaper l'URL et garde la télécommande à portée, sans changer le rôle de l'app.

## Questions fréquentes

### Faut-il installer la PWA ?

Non. Le navigateur mobile suffit. L'installation évite de retaper l'URL et garde la télécommande à portée, mais le jumelage et les commandes fonctionnent déjà dans l'onglet.

### Le téléphone et l'ordinateur doivent-ils être sur le même Wi-Fi ?

Non. Le jumelage et les commandes passent par Firestore, un service en ligne de Google : il suffit que les deux appareils aient accès à Internet. Hors ligne, aucune commande ne part.

### Que se passe-t-il si je recharge la page mobile ?

La connexion anonyme, gardée en mémoire, est perdue. Il faut rechoisir un pseudo, ce qui ouvre un nouveau compte anonyme, puis jumeler de nouveau vos postes avec un nouveau QR code affiché sur le desktop.

### Pourquoi l'historique ne suit-il pas d'un téléphone à l'autre ?

Parce que la PWA est une télécommande, pas le carnet de bord du poste. Seul le desktop conduit les sessions et connaît leur issue réelle. Ce que le téléphone peut honnêtement noter, c'est ce qu'il a **vu** pendant qu'il était ouvert. Publier cette observation ailleurs en ferait une seconde vérité, divergente. L'historique reste donc local à l'appareil.

### « Page d'achat atteinte » veut-il dire que l'achat a réussi ?

Non. Cela signifie que le poste a signalé être arrivé sur la page d'achat. La télécommande constate cet état ; elle ne confirme pas un paiement ni un billet obtenu. Pour le détail de ce qui s'est passé ensuite, regardez Miss Ticket sur le desktop.

### Peut-on arrêter toutes les sessions d'un coup ?

Oui, depuis l'écran Sessions du desktop concerné : l'action **Arrêter tout** envoie la commande au poste. Vérifiez que la télécommande est en ligne avant de l'utiliser : hors ligne, la commande resterait en suspens.

## Sources

- [Authentification anonyme, Firebase](https://firebase.google.com/docs/auth/web/anonymous-auth) : des comptes anonymes temporaires.
- [Persistance de la connexion, Firebase](https://firebase.google.com/docs/auth/web/auth-state-persistence) : une connexion gardée en mémoire disparaît au rechargement.
- [localStorage, MDN](https://developer.mozilla.org/fr/docs/Web/API/Window/localStorage) : des données propres à l'origine, sans date d'expiration.
