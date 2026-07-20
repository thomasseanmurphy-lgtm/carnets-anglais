# CLAUDE.md

Plateforme d'apprentissage d'anglais pour les centres de formation (UIMM, AFTRAL…).
Des **carnets** interactifs, notés sur /20, un seul lien pour les élèves.

## Deux mondes

- **Le site** (ce repo) — pages HTML statiques sur **GitHub Pages**. Ce que voient les élèves.
- **Le serveur `carnets-api`** — Cloudflare Worker + base KV, dans le dossier voisin
  `../Carnets Anglais - API/`. Garde et recalcule les résultats.

## Structure

```
index.html                     hub élèves (centre → classe → carnet)
stats.html                     outil stats prof
assets/platform.js             branchement API ajouté à chaque carnet (envoi auto, roster, suivi)
<classe>/<slug>/index.html     un carnet (ms · cprp · elec · aftral · ndrc · gtla)
_specs/*.json                  fiches sources des carnets (gitignorées)
docs/                          documentation détaillée
```

## Règle d'or : ne jamais éditer le HTML d'un carnet à la main

Un carnet = **1 page HTML autonome, générée** depuis **1 fiche `_specs/<nom>.json`** via le
générateur `worksheet-b1`. Le JSON est la source ; le HTML est jeté et régénérable.

Créer / modifier un carnet :
1. écrire/éditer `_specs/<nom>.json` (le contenu)
2. régénérer avec `worksheet-b1` → écrit `<classe>/<slug>/index.html`
3. `git commit` + `push` → en ligne en ~30 s (GitHub Pages, déploiement auto sur `main`)

## À savoir

- Chaque section d'une fiche a un `theme` (la notion travaillée) → alimente le suivi par notion.
- À la validation, le carnet produit un code `GTEST1::…` (résultat compressé) que `platform.js`
  envoie tout seul à l'API. Pas de bouton, pas d'e-mail.
- **Privés / gitignorés** (locaux) : `_specs/`, `_journal/` (notes perso),
  `COMMENT LA PLATEFORME EST CONSTRUITE.md`, `TASKS.md`, le `.docx`.
- **Versionnés** (source de vérité publique) : `docs/`, `notes/`, `CHANGELOG.md`, `CLAUDE.md`.

## Aller plus loin

La doc versionnée est dans **`docs/`** (source de vérité du fonctionnement) :
- `docs/reproduction.md` — remonter la plateforme de zéro (site + serveur).
- `docs/architecture.md` — le socle (flux `GTEST1`, identité `normId`, modèle KV, endpoints).
- `docs/exploitation.md` — le quotidien (rosters, export, reset, mises à jour, problème connu).
- `docs/README.md` — sommaire complet ; `docs/sons.md`, `docs/carnets-et-grammaire.md`, etc.

Idées futures **non construites** → `notes/`. Historique → `CHANGELOG.md`.
