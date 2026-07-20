# Reproduire la plateforme de zéro

But : repartir de rien et **remonter la plateforme complète** (site + serveur). Lisez d'abord
[`architecture.md`](architecture.md) pour la vue d'ensemble.

La plateforme = **deux morceaux indépendants** à mettre en place puis à relier :

1. **Le site** — pages statiques sur **GitHub Pages** (ce dépôt).
2. **Le serveur `carnets-api`** — un **Cloudflare Worker + KV**.

---

## 0. Prérequis

- Un compte **GitHub** (gratuit) — pour héberger le site via Pages.
- Un compte **Cloudflare** (gratuit) — pour le Worker et la base KV.
- **Node.js** + **npm**, et la CLI Cloudflare **wrangler** (`npm i -g wrangler`, puis
  `wrangler login`).

---

## 1. Le site (GitHub Pages)

### 1.1 Créer le dépôt
Créer un dépôt public (ex. `carnets-anglais`) et y placer le contenu de **ce dossier**.
Le fichier **`.nojekyll`** (vide, à la racine) est requis : il empêche GitHub de « traiter »
les fichiers et sert le site tel quel.

### 1.2 Activer Pages
Dans **Settings → Pages** du dépôt : source = branche **`main`**, dossier **`/` (root)**.
En ~30 s le site est en ligne à `https://<compte>.github.io/<dépôt>/`.
**Tout push sur `main` redéploie automatiquement.**

### 1.3 La structure (conventions)
```
index.html                     hub élèves (centre → classe → carnet)
stats.html                     outil stats prof (secours, legacy)
assets/platform.js             le « tuyau » ajouté à chaque carnet
<classe>/<slug>/index.html     un carnet autonome
.nojekyll                      (vide) — indispensable pour Pages
```
- **Une classe = un dossier** (`ms`, `cprp`, `elec`, `aftral`, `ndrc`, `gtla`, `tourisme`).
- **Un carnet = `<classe>/<slug>/index.html`**. Le slug et la classe sont **lus dans l'URL** par
  `platform.js` : c'est ce qui rattache le résultat. Respecter ce chemin suffit.
- `index.html` (le hub) liste les carnets par centre → classe → carnet.

### 1.4 Les carnets eux-mêmes
Chaque carnet est **1 page HTML autonome, générée** depuis **1 fiche `_specs/<nom>.json`** via le
générateur **`worksheet-b1`** (voir [`anatomie-carnet.md`](anatomie-carnet.md)).

⚠️ **Honnêteté sur la reproductibilité :**
- Le **HTML généré est committé** et **auto-suffisant** → cloner le dépôt reproduit tous les
  carnets **tels quels**, sans rien d'autre.
- Le **générateur `worksheet-b1` et les `_specs/*.json` ne sont PAS dans le dépôt** (`_specs/` est
  gitignoré ; le générateur est un outil externe). Pour **créer ou modifier** un carnet, il faut
  disposer du générateur et des fiches. Sans lui, on peut faire tourner et servir la plateforme,
  mais pas fabriquer de nouveaux carnets.

---

## 2. Le serveur (Cloudflare Worker + KV)

Dans le dossier voisin `../Carnets Anglais - API/` :

### 2.1 `wrangler.jsonc`
```jsonc
{
  "name": "carnets-api",
  "main": "src/index.js",
  "compatibility_date": "2025-01-01",
  "observability": { "enabled": true },
  "kv_namespaces": [
    { "binding": "RESULTS", "id": "<mettre l'id de l'étape 2.2>" }
  ]
}
```

### 2.2 Créer la base KV et la brancher
```sh
wrangler kv namespace create RESULTS
```
Copier l'`id` renvoyé dans `wrangler.jsonc` (binding **`RESULTS`** — le code y accède via
`env.RESULTS`).

### 2.3 Le code
`src/index.js` contient tout le Worker (endpoints, modèle KV, page prof). Voir
[`architecture.md`](architecture.md) §5 pour la liste des endpoints. Deux constantes à adapter :
- **`CLASSES`** — les classes et les titres de carnets (sert au `done/total` et aux jolis titres) ;
- **`THEMES`** — les libellés de notions pour le récap « à réviser ».

### 2.4 La clé prof (secret)
```sh
wrangler secret put TEACHER_KEY      # saisir une valeur longue et privée
```
Elle protège `/teacher`, `/api/teacher`, `/api/export`, `/api/reset` (comparée à `env.TEACHER_KEY`).
**Ne jamais** la mettre dans le code ni dans un fichier versionné.

### 2.5 Déployer
```sh
wrangler deploy
```
Wrangler renvoie l'URL publique du Worker (`https://carnets-api.<compte>.workers.dev`).

---

## 3. Relier les deux

Dans `assets/platform.js`, mettre la constante **`API`** sur l'URL du Worker :
```js
var API = "https://carnets-api.<compte>.workers.dev";
```
Le Worker répond déjà avec des en-têtes **CORS `*`**, donc le site (autre domaine) peut l'appeler.
Committer + pousser → en ligne.

---

## 4. Amorcer une classe (roster)

Pour qu'une classe ait le **menu déroulant de noms**, il faut écrire `roster:<classe>` en KV.
**Il n'existe pas encore d'endpoint d'écriture** — aujourd'hui c'est manuel :
```sh
wrangler kv key put "roster:cprp" '["NOM Prénom","NOM Prénom", …]' --binding RESULTS --remote
```
(ou via le dashboard Cloudflare → KV). Une classe **sans** roster fonctionne : l'élève tape son
nom dans un champ libre. Gérer/mettre à jour un roster chaque trimestre : voir
[`exploitation.md`](exploitation.md).

---

## 5. Vérifier

1. Ouvrir un carnet en ligne, le compléter → la barre du bas affiche « progression enregistrée ».
2. Ouvrir `https://carnets-api.<compte>.workers.dev/teacher?key=<clé>` → l'élève apparaît.
3. Si une classe a un roster, son carnet doit proposer le **menu déroulant** au lieu du champ libre.

---

## 6. Résumé des dépendances externes

| Élément | Dans le dépôt ? | Note |
|---|---|---|
| Carnets HTML, hub, `platform.js` | ✅ | auto-suffisants |
| Worker `src/index.js`, `wrangler.jsonc` | ⚠️ dossier voisin, non versionné | à versionner (voir plus bas) |
| Générateur `worksheet-b1` | ❌ | externe — requis seulement pour **créer** des carnets |
| Fiches `_specs/*.json` | ❌ (gitignoré) | locales |
| Clé prof `TEACHER_KEY` | ❌ (secret) | à définir soi-même |

> **Recommandation :** versionner aussi `Carnets Anglais - API/` (`git init`), en **ignorant**
> `.teacher-key.txt` et `.wrangler/`. Aujourd'hui le backend n'a aucun historique ni sauvegarde.
