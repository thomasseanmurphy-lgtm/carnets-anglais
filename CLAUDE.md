# CLAUDE.md

Plateforme d'apprentissage d'anglais pour les centres de formation (UIMM, AFTRAL…).
Des **carnets** interactifs, notés sur /20, un seul lien pour les élèves.

## Deux mondes

- **Le site** (ce repo) — site statique **Astro** déployé sur **GitHub Pages** par Actions. Ce que voient les élèves.
- **Le serveur `carnets-api`** — Cloudflare Worker + base KV, dans le dossier voisin
  `../Carnets Anglais - API/`. Garde et recalcule les résultats.

## Structure

```
src/content/carnets/<classe>--<slug>.json   LA SOURCE : une fiche = un carnet (versionnée)
src/content.config.ts                       schéma Zod de la fiche (erreur de build si réponse ∉ options)
src/pages/[classe]/[slug]/index.astro       la page carnet (même URL qu'avant : /<classe>/<slug>/)
src/layouts/Carnet.astro                    coquille commune (chrome, popovers, mascotte, scripts)
src/styles/carnet.css                       design partagé (skins, glass, mascotte, moteur) — 1 seul endroit
public/assets/carnet-engine.js              MOTEUR : note /20 + code GTEST1 (identique à l'ancienne prod)
public/assets/platform.js                   branchement API (envoi auto, roster, sons, menu maison) — inchangé
public/assets/carnet-ui.js                  couche design (skins, paillettes, mascotte, karaoké, dico)
public/index.html · public/stats.html       hub élèves · outil stats prof (servis tels quels)
public/audio/<slug>.mp3 + .words.json       voix karaoké (ElevenLabs) quand elle existe
tests/gtest1-diff.mjs · tests/golden/       GATE : le code GTEST1 doit rester identique aux pages de référence
scripts/import-specs.py                     migration des anciennes fiches _specs/ (one-shot, gardé pour mémoire)
docs/                                       documentation détaillée
```

## Règle d'or : ne jamais éditer le HTML d'un carnet à la main

Un carnet = **1 fiche JSON** → **1 page générée** au build. Le JSON est la source ; `dist/` est jeté.

Créer / modifier un carnet :
1. écrire/éditer `src/content/carnets/<classe>--<slug>.json` (le contenu ; schéma dans `src/content.config.ts`)
2. `npm run build` (vérifie le schéma + génère `dist/`) puis `npm test` (gate GTEST1) si le moteur a bougé
3. `git commit` + `push` sur `main` → Actions construit et publie (~1 min)

Aperçu local : `npm run dev` → http://localhost:4321/carnets-anglais/

## À savoir

- Chaque section d'une fiche a un `theme` (la notion travaillée) → alimente le suivi par notion.
  Un item peut avoir son propre `theme` ; une section peut fixer `id_prefix` (carnets historiques).
- `test_name` est écrit **tel quel** dans le code `GTEST1` (les stats agrègent dessus ; certains contiennent `&amp;` : conserver).
- À la validation, le carnet produit un code `GTEST1::…` que `platform.js` envoie tout seul à l'API. Pas de bouton.
- **Ne jamais modifier `carnet-engine.js` sans faire passer `npm test`** (19 carnets × 4 motifs de réponses).
- **Privés / gitignorés** (locaux) : `_specs/` (anciennes fiches), `_journal/`, `_rebuild/` (maquette), `COMMENT LA PLATEFORME EST CONSTRUITE.md`, `TASKS.md`, le `.docx`.
- **Versionnés** : `docs/`, `notes/`, `CHANGELOG.md`, `CLAUDE.md`, `src/content/carnets/`.

## Aller plus loin

- `docs/refonte-astro.md` — la refonte : architecture, gate GTEST1, bascule, décisions.
- `docs/architecture.md` — le socle (flux `GTEST1`, identité `normId`, modèle KV, endpoints).
- `docs/exploitation.md` — le quotidien (rosters, export, reset, mises à jour, problème connu).
- `docs/README.md` — sommaire complet ; `docs/sons.md`, `docs/carnets-et-grammaire.md`, etc.

Idées futures **non construites** → `notes/`. Historique → `CHANGELOG.md`.
