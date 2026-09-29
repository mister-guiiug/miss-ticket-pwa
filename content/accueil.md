## Pour qui

Les personnes qui utilisent Miss Ticket, l'application de bureau, et veulent suivre ses sessions depuis leur téléphone.

## Comment ça marche

Vous choisissez un pseudo, puis vous appairez un poste en scannant le QR code qu'affiche Miss Ticket desktop. La télécommande liste les postes appairés et leurs sessions, et permet d'arrêter une session ou toutes. Elle ne lance rien et n'achète rien. Depuis le 21 mai 2026, le desktop ne se connecte plus au service qui relie les deux et n'affiche plus de QR code : l'appairage n'aboutit pas tant que ce lien n'est pas rétabli.

## Vos données

La connexion est anonyme, par Firebase (Google) : ni e-mail ni mot de passe, seulement un pseudo, et elle ne survit pas à un rechargement. Firestore garde votre profil (pseudo et dates), la fiche des postes appairés, l'état des jetons d'appairage et les commandes d'arrêt. L'historique des sessions terminées reste dans le navigateur ; il note l'adresse e-mail du compte de chaque session et l'adresse du concert. Sentry (région européenne) signale les erreurs dès l'ouverture, sans demande de consentement ; PostHog (nuage européen) ne mesure l'audience qu'après votre accord.

## Prix

Gratuit et open source, sous licence MIT.
