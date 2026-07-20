# Architecture — comment la plateforme fonctionne

Le **socle** : les deux mondes, comment ils se parlent, et comment les données sont rangées.
C'est la **source de vérité** sur le fonctionnement actuel. L'historique va dans
[`../CHANGELOG.md`](../CHANGELOG.md), les idées non construites dans [`../notes/`](../notes/).

---

## 1. Deux mondes

```
   ÉLÈVE (navigateur)                          PROF
        │                                        │
        ▼                                        ▼
┌─────────────────────┐   POST code    ┌────────────────────────┐
│  LE SITE            │ ─────────────▶ │  LE SERVEUR            │
│  GitHub Pages       │   GTEST1::…    │  carnets-api           │
│  (pages HTML fixes) │                │  Cloudflare Worker + KV │
│  index.html, carnets│ ◀───────────── │  /teacher, /me, /export │
└─────────────────────┘   roster, /me  └────────────────────────┘
```

- **Le site** (ce dépôt) — pages HTML **statiques** servies par **GitHub Pages**. Aucune
  logique serveur. C'est ce que voient les élèves. Chaque carnet est une page **autonome**.
- **Le serveur `carnets-api`** — un **Cloudflare Worker** + une base **KV**, dans le dossier
  voisin `../Carnets Anglais - API/`. Il **reçoit, garde et recalcule** les résultats, et sert
  le tableau de bord prof. *(Ce dossier n'est pas encore versionné — voir
  [`reproduction.md`](reproduction.md).)*

Les deux ne partagent aucune base de code. Le seul lien est **une URL** : `platform.js` connaît
l'adresse du Worker.

---

## 2. Le parcours d'un résultat (le flux central)

1. L'élève ouvre un carnet, **choisit son nom** (menu déroulant si la classe a un roster, sinon
   champ libre) et répond.
2. À la validation, le carnet calcule la note et fabrique un **code `GTEST1::…`** : un JSON
   (nom, classe, carnet, note /20, détail par question/thème) **compressé en base64**.
3. `assets/platform.js`, ajouté à chaque carnet, **détecte ce code** et l'envoie **tout seul**
   en `POST /api/submit`. Pas de bouton, pas d'e-mail.
4. Le Worker **décode** le code, écrit le résultat en KV, et renvoie un lien **« Ma progression »**
   (`/me?s=<studentId>`) que l'élève voit apparaître.
5. Le prof consulte `/teacher?key=…` en direct (agrégé, par classe, par thème, par élève).

> **Pourquoi un code compressé ?** Le site est statique : il ne peut pas « pousser » de données.
> Le code rend le résultat **auto-porté** — il contient tout, se transmet en une requête, et se
> recalcule côté serveur sans faire confiance au navigateur pour l'agrégation.

---

## 3. L'identité d'un élève

```js
studentId = normId(classId, name)      // ex. "cprp.alves-clementine"
```

`normId` (dans `src/index.js`) minuscule + retire les accents + remplace tout le reste par des
tirets. **C'est cette clé qui porte tout l'historique d'un élève** et son lien « Ma progression ».

⚠️ **Conséquences** (importantes pour le suivi dans le temps) :
- corriger une faute dans un nom = **nouvel** élève, l'ancien historique devient orphelin ;
- deux **homonymes** dans une classe **fusionnent** ;
- l'identité est liée à la **classe** : si `cprp` reste `cprp`, plusieurs promos se superposent.

C'est le cœur du sujet « suivre les évolutions du contingent » — voir
[`../notes/archivage-progression-eleves.md`](../notes/archivage-progression-eleves.md).

---

## 4. Le modèle de données (KV)

Une seule base KV, binding **`RESULTS`**. Les clés :

| Clé | Contenu | Écrite par |
|---|---|---|
| `idx:<studentId>` | Résumé roulant d'un élève (carnets faits, notes, dates) | `submit`, `visit` |
| `sub:<class>:<slug>:<studentId>:<ts>` | Un envoi précis (historique, TTL ~400 j) | `submit` |
| `dash` | **Cache** du tableau prof (reconstruit depuis les `idx:`) | `submit`, `rebuild` |
| `feed` | Activité récente (50 derniers) | `submit` |
| `roster:<class>` | **Liste des noms** d'une classe (tableau JSON) | *manuel (pas d'endpoint)* |

> **Source vs cache.** Les `idx:` (+ `sub:`) sont la **source** ; `dash` est un **cache** dérivé.
> Le bouton « 🔁 Recalculer » du tableau prof reconstruit `dash` depuis la source (utile après un
> changement de roster).

---

## 5. Les endpoints du Worker

| Méthode · chemin | Rôle | Accès |
|---|---|---|
| `POST /api/submit` | Un carnet envoie un code `GTEST1` | public |
| `POST /api/visit` | Signale qu'un élève a ouvert un carnet (≤ 1×/jour) | public |
| `GET /api/roster?class=` | Liste des noms d'une classe (pour le menu déroulant) | public |
| `GET /me?s=<studentId>` | Page « Ma progression » (élève) | public (par lien) |
| `GET /teacher?key=` | Tableau de bord prof (HTML) | **clé prof** |
| `GET /api/teacher?key=` | Le même, en JSON | **clé prof** |
| `GET /api/export?key=&format=csv\|json&class=` | Export des données | **clé prof** |
| `POST /api/reset?key=` | Efface les **résultats** d'une classe (garde le roster) | **clé prof** |

La **clé prof** est un **secret Worker** (`env.TEACHER_KEY`), jamais dans le code ni dans cette
doc. Les endpoints publics n'exposent qu'un nom d'élève et des notes — aucune donnée sensible.

---

## 6. Les points de configuration

| Quoi | Où | Sert à |
|---|---|---|
| Adresse du Worker | `assets/platform.js` (const `API`) | brancher le site au serveur |
| Liste des classes & titres de carnets | `src/index.js` → `CLASSES` | jolis titres + `done/total` |
| Libellés de thèmes | `src/index.js` → `THEMES` | récap « à réviser » |
| Binding KV, nom du Worker | `wrangler.jsonc` | déploiement Cloudflare |
| Clé prof | secret `TEACHER_KEY` | protéger `/teacher`, `/export`, `/reset` |

> ⚠️ **Piège connu.** `CLASSES` sert à calculer le `done/total` de chaque élève. S'il diverge des
> carnets réellement en ligne, un élève peut afficher un total faux (ex. « 4/2 »). Voir la section
> *Problème connu* de [`exploitation.md`](exploitation.md) et le catalogue de référence dans
> [`carnets-et-grammaire.md`](carnets-et-grammaire.md).

---

## 7. Ce que ça coûte

Tout tient dans les **paliers gratuits** : GitHub Pages (site statique) et Cloudflare Workers + KV
(lectures/écritures modestes, le cache `dash` limite les lectures KV). Aucun serveur à payer, aucune
base de données à administrer.
