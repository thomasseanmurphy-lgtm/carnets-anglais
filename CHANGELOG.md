# Changelog

Historique des évolutions notables de la plateforme (site + serveur `carnets-api`).
Le fonctionnement **actuel** est décrit dans [`docs/`](docs/) ; les idées **futures** dans
[`notes/`](notes/). Dates au format AAAA-MM.

> Le journal de bord détaillé et les notes de travail personnelles restent **privés** (hors dépôt).

---

## 2026-07

### Sons & menu « maison » *(voir [`docs/sons.md`](docs/sons.md))*
- Ajout d'un **retour sonore** sur tous les carnets (moteur Cuelume porté en vanilla, 14 sons
  synthétisés, aucun fichier audio), branché dans `assets/platform.js`.
- Sons sur survol, ouverture de menu, choix de réponse, boutons ; validation **`bloom`** (avec
  erreur) / **`sparkle`** (100 %) / **`success`** (fin de carnet).
- **Menu déroulant « maison »** pour les réponses : permet un son au survol de chaque choix, le
  `<select>` natif restant la source de vérité (note et correction intactes) ; natif sur tactile.
  - fix : afficher **toutes** les options (le plafond de hauteur en cachait) ;
  - fix : **sélection au relâchement** (`mouseup`) pour le geste presser-glisser-relâcher.
- **Bouton mute** (icône SVG, préférence mémorisée) + amorçage anti-rafale au rechargement.

### Contenu
- Nouveaux carnets CPRP (`cnc-machining`, `qc-series`) et ELEC (`automation-grafcet`).

## 2026-07 (antérieur — plateforme & serveur)
- **Envoi automatique** des résultats : suppression du bouton « Envoyer » et de l'e-mail — dès
  qu'un code `GTEST1` est prêt, `platform.js` l'envoie seul.
- **Suivi des connexions** (`/api/visit`) et suppression de la saisie de date.
- **Notation** : les réponses fausses sont désormais révélées (correction visible).
- **Cache `dash`** côté serveur pour limiter les lectures KV (quota Cloudflare).
- **Déploiement** : publication automatique via GitHub Pages sur `main`.
- **Regroupement** : un site unique remplace les 3 anciens (`bts-ms-english`,
  `bts-cprp-english`, `theo-internship-adventure`), laissés en ligne pour ne pas casser les liens.

---

*Réorganisation de la documentation (ce dépôt) : voir `docs/README.md` pour la structure actuelle.*
