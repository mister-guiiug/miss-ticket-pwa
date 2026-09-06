# 🌐 Miss Ticket PWA

> Interface web progressive pour contrôler à distance votre application Miss Ticket

![React](https://img.shields.io/badge/React-19-blue.svg)
![Vite](https://img.shields.io/badge/Vite-8-purple.svg)
![PWA](https://img.shields.io/badge/PWA-Enabled-green.svg)

## 📱 À Propos

Cette PWA permet de contrôler l'application desktop **Miss Ticket** à distance depuis mobile ou tablette.

## 🚀 Développement

```bash
npm install
npm run dev
```

## 📦 Build

```bash
npm run build
npm run preview
```

## 📡 Communication avec le desktop

La PWA communique avec l'application desktop via Firebase (Firestore) :

- **Appariement** : le desktop affiche un QR code
  `missticket:pair?token=…&id=…` ; la PWA le scanne, valide le token
  (collection `pairing_tokens`) puis enregistre le desktop.
- **Commandes** : la PWA écrit les commandes (`launch_session`,
  `stop_session`, `stop_all`, `get_state`) dans la collection `commands` ;
  le desktop les exécute et publie son état (collection `desktops`),
  observé en temps réel par la PWA.

## 💾 Ce que la PWA garde, et où

Tout ce que la PWA conserve tient dans le `localStorage` de l'appareil, sous
le préfixe `ticket_` et sous l'enveloppe versionnée du socle (`{ v, data }`,
migrations, copie de côté avant toute perte). Rien n'est écrit dans Firestore
par la PWA en dehors des commandes.

- `ticket_settings` — les réglages (notifications, son, vibration).
- `ticket_history` — **l'historique des sessions terminées** : l'issue
  constatée (page d'achat atteinte, échec, arrêt demandé, fin subie), la
  position finale dans la file, le poste et le concert.

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
