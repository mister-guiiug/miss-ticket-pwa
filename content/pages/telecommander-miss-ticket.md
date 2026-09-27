---
title: Télécommander Miss Ticket depuis le téléphone
description: Relier un téléphone à Miss Ticket desktop pour piloter une session à distance : jumelage QR, gestes utiles, historique local et limites de la télécommande PWA.
---

# Télécommander Miss Ticket depuis le téléphone

Miss Ticket est une application **desktop**. La PWA Miss Ticket n'est pas un second client autonome : c'est une **télécommande** installable sur le téléphone, jumelée à la session déjà ouverte sur l'ordinateur. L'ordinateur conduit les sessions ; le mobile les lance, les suit et les arrête sans quitter la file ou l'écran principal du poste.

## À quoi ça sert

Quand la file ou l'écran principal occupe le poste, le téléphone permet d'agir sans se pencher sur le clavier : démarrer une session, vérifier où elle en est, l'arrêter, ou stopper toutes les sessions d'un coup. L'ordinateur reste la source de vérité. Le mobile ne stocke pas la session à sa place et ne remplace pas Miss Ticket desktop.

Cas d'usage typiques :

- vous êtes debout près de l'entrée ou de la file, téléphone en main, pendant que le poste tourne sur le bureau ;
- vous voulez surveiller plusieurs postes appairés sans ouvrir chacun d'eux ;
- vous devez arrêter une session rapidement sans toucher à la souris du desktop.

## Comment jumeler

1. Ouvrez Miss Ticket sur le desktop et lancez l'appairage : un QR code s'affiche (et souvent un code à 6 chiffres en secours).
2. Sur le téléphone, ouvrez [Miss Ticket](https://mister-guiiug.github.io/miss-ticket-pwa/), choisissez un pseudo, puis **Appairer un desktop**.
3. Scannez le QR code avec la caméra, ou saisissez le code à 6 chiffres affiché sur le poste.
4. Une fois la liaison établie, le desktop apparaît dans la liste **Desktops** de la télécommande.

Le jumelage passe par un jeton d'appairage éphémère. Il expire si la session desktop se ferme, si le jeton n'est plus valide, ou si le réseau coupe trop longtemps : il faudra alors recommencer depuis le desktop.

## Ce que la télécommande peut faire

Une fois le poste appairé, [Miss Ticket](https://mister-guiiug.github.io/miss-ticket-pwa/) expose trois écrans utiles :

- **Desktops** : la liste des postes appairés, avec le nombre de sessions en cours et un indicateur de connexion.
- **Sessions** : pour un poste donné, le détail des sessions actives (connectées, en attente, page d'achat atteinte) et les actions : lancer, arrêter une session, ou **arrêter tout**.
- **Historique** : les sessions terminées **telles que la télécommande les a vues** pendant qu'elle était ouverte — issue constatée (page d'achat atteinte, échec, arrêt demandé, fin subie), position finale dans la file, poste et concert.

Les commandes partent vers le desktop (lancer, arrêter, demander l'état). Le desktop exécute et republie son état ; la PWA l'observe en temps réel. Hors ligne, aucune commande n'aboutit : le bandeau le dit clairement, pour éviter de croire qu'un arrêt a bien été envoyé.

## Ce que la télécommande ne fait pas

- Elle **ne remplace pas** l'application desktop : sans Miss Ticket ouvert sur le poste, il n'y a rien à piloter.
- Elle ne contourne **aucune** file d'attente tierce : elle pilote uniquement Miss Ticket.
- Elle ne conserve pas d'identifiants de sites marchands : le couple téléphone / desktop reste dans le périmètre de Miss Ticket.
- Elle n'est **pas** une seconde source de vérité pour l'issue des sessions : l'historique mobile ne retient que ce que la PWA a observé pendant qu'elle était ouverte. Il reste sur l'appareil (`localStorage`), ne suit pas d'un téléphone à l'autre, et disparaît si vous effacez les données locales.
- Elle ne reçoit pas de notification poussée quand une session se termine hors de l'écran : pour voir une issue, la télécommande doit être ouverte au moment où la session s'arrête.

## Limites utiles à connaître

- **Réseau** : l'appairage et les commandes demandent une connexion. Sur le même Wi-Fi que le poste, le jumelage local est en général le plus stable ; si Miss Ticket propose un autre mode, suivez l'indication affichée sur le desktop au moment du QR.
- **Rechargement de la page mobile** : la liaison peut se perdre. Rouvrez l'appairage depuis le desktop, puis reconnectez le téléphone.
- **Plusieurs desktops** : vous pouvez appairer plusieurs postes sur le même téléphone ; chaque commande cible le desktop choisi dans la liste.
- **Installation PWA** : facultative. « Ajouter à l'écran d'accueil » évite de retaper l'URL et garde la télécommande à portée, sans changer le rôle de l'app.

## Questions fréquentes

### Faut-il installer la PWA ?

Non. Le navigateur mobile suffit. L'installation (Ajouter à l'écran d'accueil) évite de retaper l'URL et garde la télécommande à portée, mais le jumelage et les commandes fonctionnent déjà dans l'onglet.

### Le téléphone et l'ordinateur doivent-ils être sur le même Wi-Fi ?

En général oui pour un jumelage local stable. Si Miss Ticket propose un relais distant, suivez l'indication affichée dans l'app desktop au moment du jumelage. Dans tous les cas, hors ligne, aucune commande ne part.

### Que se passe-t-il si je recharge la page mobile ?

La liaison peut se perdre. Rouvrez le jumelage depuis le desktop (nouveau QR ou nouveau code), puis reconnectez le téléphone. Les desktops déjà appairés peuvent réapparaître selon l'état conservé côté téléphone, mais une session active demande souvent de revérifier la connexion.

### Pourquoi l'historique ne suit-il pas d'un téléphone à l'autre ?

Parce que la PWA est une télécommande, pas le carnet de bord du poste. Seul le desktop conduit les sessions et connaît leur issue réelle. Ce que le téléphone peut honnêtement noter, c'est ce qu'il a **vu** pendant qu'il était ouvert. Publier cette observation ailleurs en ferait une seconde vérité, divergente. L'historique reste donc local à l'appareil.

### « Page d'achat atteinte » veut-il dire que l'achat a réussi ?

Non. Cela signifie que le poste a signalé être arrivé sur la page d'achat. La télécommande constate cet état ; elle ne confirme pas un paiement ni un billet obtenu. Pour le détail de ce qui s'est passé ensuite, regardez Miss Ticket sur le desktop.

### Peut-on arrêter toutes les sessions d'un coup ?

Oui, depuis l'écran Sessions du desktop concerné : l'action **Arrêter tout** envoie la commande au poste. Vérifiez que la télécommande est en ligne avant de l'utiliser — hors ligne, la commande resterait en suspens.
