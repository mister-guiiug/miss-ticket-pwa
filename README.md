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
