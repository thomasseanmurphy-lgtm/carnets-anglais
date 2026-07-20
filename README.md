# Carnets d'anglais — plateforme

Carnets d'exercices d'anglais **interactifs**, auto-corrigés **/20**, pour les centres de formation
(UIMM, AFTRAL…). **Un seul lien** pour les élèves ; suivi individuel et par classe pour le prof.

## 🔗 Le lien élèves
**https://thomasseanmurphy-lgtm.github.io/carnets-anglais/**
Le hub (`index.html`) va du centre → classe → carnet. L'élève choisit son nom (menu déroulant si la
classe a une liste, sinon champ libre), répond, et sa progression **s'enregistre toute seule**.

## Deux mondes
- **Le site** (ce dépôt) — pages HTML **statiques** sur **GitHub Pages**. Ce que voient les élèves.
- **Le serveur `carnets-api`** — **Cloudflare Worker + KV**, dans le dossier voisin
  `../Carnets Anglais - API/`. Reçoit, garde et recalcule les résultats ; sert le tableau prof.

## Structure
```
index.html                     hub élèves (centre → classe → carnet)
stats.html                     outil stats prof (secours, legacy)
assets/platform.js             le « tuyau » ajouté à chaque carnet (envoi auto, roster, sons)
<classe>/<slug>/index.html     un carnet autonome (ms · cprp · elec · aftral · ndrc · gtla)
docs/                          documentation (source de vérité du fonctionnement)
notes/                         idées futures, non construites
CHANGELOG.md                   historique des évolutions
_specs/*.json                  fiches sources des carnets (locales, gitignorées)
```

## Documentation
Tout est dans **[`docs/`](docs/)**. Points d'entrée :
- **[Reproduire la plateforme de zéro](docs/reproduction.md)** — remonter site + serveur.
- **[Architecture](docs/architecture.md)** — comment ça marche (flux, données, endpoints).
- **[Exploitation](docs/exploitation.md)** — le quotidien : consulter, exporter, rosters, mises à jour.

## Règle d'or
**Ne jamais éditer le HTML d'un carnet à la main.** Un carnet est **généré** depuis
`_specs/<nom>.json` via le générateur `worksheet-b1` — voir
[`docs/anatomie-carnet.md`](docs/anatomie-carnet.md).

---
*Notes de travail personnelles (journal de build, task list) : gardées **hors dépôt**.*
