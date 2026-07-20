# Documentation — plateforme « Carnets d'anglais »

> **Ce dossier = la source de vérité** sur *comment la plateforme fonctionne aujourd'hui*.
> L'historique va dans [`../CHANGELOG.md`](../CHANGELOG.md), les idées futures dans
> [`../notes/`](../notes/). Un fait = un seul endroit.

La plateforme, c'est **deux mondes** qui se parlent : le **site** (pages statiques sur GitHub
Pages, ce que voient les élèves) et le **serveur `carnets-api`** (Cloudflare Worker + KV, qui garde
et recalcule les résultats).

## Par où commencer
| Je veux… | Lire |
|---|---|
| **Remonter la plateforme de zéro** | [`reproduction.md`](reproduction.md) |
| Comprendre **comment ça marche** | [`architecture.md`](architecture.md) |
| **L'exploiter au quotidien** (rosters, export, mises à jour) | [`exploitation.md`](exploitation.md) |

## Référence par sujet
| Fichier | Contenu |
|---|---|
| [`architecture.md`](architecture.md) | Les deux mondes, le flux d'un résultat, le code `GTEST1`, l'identité `normId`, le modèle KV, les endpoints, la config, les coûts. |
| [`reproduction.md`](reproduction.md) | Étapes pour reconstruire site + serveur ; dépendances externes. |
| [`exploitation.md`](exploitation.md) | Runbook : consulter, exporter, réinitialiser, faire vivre les rosters, mises à jour à chaud, problème connu. |
| [`anatomie-carnet.md`](anatomie-carnet.md) | Comment un carnet est fabriqué : structure, fiche `_specs/*.json`, générateur `worksheet-b1`. |
| [`plateforme-web.md`](plateforme-web.md) | Le front : `index.html` (hub) et `assets/platform.js` (le « tuyau »). |
| [`carnets-et-grammaire.md`](carnets-et-grammaire.md) | **Catalogue de référence** des carnets (par classe/niveau) et notions travaillées. |
| [`sons.md`](sons.md) | Retour sonore et menu déroulant « maison » des réponses. |
| [`design.md`](design.md) | Système visuel : couleurs, polices, composants, les deux identités. |
| [`animations.md`](animations.md) | Animations et interactions (accordéons, fonds, réactions, barres). |

## Où vit chaque chose
```
Carnets Anglais/                 ← le SITE (dépôt GitHub « carnets-anglais », public)
├── index.html · stats.html      hub élèves · outil stats prof (secours)
├── assets/platform.js           le « tuyau » de chaque carnet
├── <classe>/<slug>/index.html   un carnet
├── docs/                        ← CE dossier (fonctionnement actuel)
├── notes/                       ← idées futures, non construites
├── CHANGELOG.md                 ← historique
├── _specs/*.json                fiches sources (locales, gitignorées)
└── _journal/ · COMMENT… · TASKS.md   notes perso — JAMAIS versionnées

Carnets Anglais - API/           ← le SERVEUR (dossier voisin)
├── src/index.js                 le Worker (endpoints + base KV)
└── wrangler.jsonc               config Cloudflare
```

## Conventions
- On décrit **ce qui existe aujourd'hui**, pas un idéal futur (ça, c'est `notes/`).
- Une valeur chiffrée est donnée avec **l'endroit où la changer**.
- Aucun secret dans la doc (la clé prof est un *secret* Worker).
