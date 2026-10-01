# 🌐 Miss Ticket PWA

> Interface web progressive pour contrôler à distance votre application Miss Ticket

![React](https://img.shields.io/badge/React-19-blue.svg)
![Vite](https://img.shields.io/badge/Vite-8-purple.svg)
![PWA](https://img.shields.io/badge/PWA-Enabled-green.svg)

## 📱 À Propos

Cette PWA est conçue pour piloter l'application desktop **Miss Ticket** à
distance depuis mobile ou tablette : suivre les postes appairés et leurs
sessions, arrêter une session ou toutes. Le lien avec le desktop est
aujourd'hui rompu, voir « Communication avec le desktop ».

## 🚀 Développement

```bash
export NODE_AUTH_TOKEN="$(gh auth token)"  # paquet du socle sur GitHub Packages
cp .env.example .env.local                 # puis renseigner les VITE_FIREBASE_*
npm install
npm run dev
```

## 📦 Build

```bash
npm run build
npm run preview
```

## 📡 Communication avec le desktop

**État actuel** : dans son code actuel (dépôt miss-ticket), l'application
desktop ne se connecte plus à Firestore depuis le 21/05/2026 et n'affiche pas
de QR d'appariement. Tant que ce lien n'est pas rétabli, la PWA ne peut ni
s'apparier ni piloter un poste. Ce qui suit décrit le protocole côté PWA.

La PWA communique avec l'application desktop via Firebase (Firestore) :

- **Appariement** : le desktop affiche un QR code
  `missticket:pair?token=…&id=…` ; la PWA le scanne, valide le token
  (collection `pairing_tokens`), puis consomme le jeton et enregistre le
  desktop **dans un seul lot**, que les règles Firestore vérifient ensemble.
- **Commandes** : la PWA écrit `stop_session` (arrêter une session) et
  `stop_all` (tout arrêter) dans la collection `commands` ; le desktop les
  exécute et publie son état (collection `desktops`), observé en temps réel par
  la PWA. `get_state` est prévue dans `src/lib/firebaseCommands.ts`, mais aucun
  écran ne l'envoie.
- **Pas de lancement à distance** : `launchSession()` écrivait l'e-mail et le
  mot de passe du compte de billetterie en clair dans `commands`. Elle est
  retirée depuis le 30/09/2026, et la PWA comme les règles refusent toute
  commande hors de la liste ci-dessus ou tout champ imprévu. Un mot de passe ne
  transite jamais par Firestore.

Les règles (`firestore.rules`) et les index (`firestore.indexes.json`) sont
publiés sur le projet Firebase à chaque fusion sur `main`, par le job
`deploy-firebase` de `deploy.yml`. C'est le seul chemin : depuis le 01/10/2026,
miss-ticket n'en garde plus de copie ni de workflow de déploiement.

## 💾 Ce que la PWA garde, et où

La PWA conserve ses données dans le `localStorage` de l'appareil : sous le
préfixe `ticket_` (réglages et historique dans l'enveloppe versionnée du socle,
`{ v, data }`, migrations, copie de côté avant toute perte ; langue en clair
dans `ticket_locale`), plus le thème (`dwc_theme`), le choix de consentement
(préfixe `dwc_consent`) et, après accord, l'état de la mesure d'audience.

- `ticket_settings` : trois réglages (niveau de notifications, son, vibration),
  enregistrés mais pas encore appliqués par l'application.
- `ticket_history` : **l'historique des sessions terminées**, avec l'issue
  constatée (page d'achat atteinte, échec, arrêt demandé, fin subie), la
  position finale dans la file, le poste, l'URL du concert, l'**e-mail du
  compte** de la session, le dernier statut et les dates.

Dans Firestore, la PWA écrit les commandes, son profil `users/{uid}` (pseudo et
dates, créé à la connexion anonyme) et, à l'appariement, le statut du jeton
(`pairing_tokens`) et la fiche du poste (`desktops`, qui garde l'identifiant du
jeton consommé : la preuve que lisent les règles). Hors Firebase, Sentry
(région UE) démarre à l'ouverture, sans consentement, et ne reçoit un rapport
technique que lorsqu'une erreur survient ; la mesure d'audience PostHog (nuage
européen) ne démarre qu'après accord dans le bandeau.

**Pourquoi l'historique n'est PAS dans Firestore.** La PWA est une
télécommande : c'est le desktop qui conduit les sessions et qui, seul, connaît
leur issue réelle. Ce que la PWA peut honnêtement écrire, c'est ce qu'elle a
_vu_ — le dernier état observé avant la disparition de la session. Publier
cette observation dans une collection en ferait un fait partagé et une seconde
source de vérité, divergente, sous une collection que le desktop ignore. Le
détail du raisonnement est en tête de `src/lib/sessionHistory.ts`.

Conséquence assumée : l'historique ne suit pas l'utilisateur d'un appareil à
l'autre, il ne retient que ce que la PWA a pu voir en étant ouverte (il n'y a
pas de notification poussée), et « Effacer les données locales » l'emporte.
