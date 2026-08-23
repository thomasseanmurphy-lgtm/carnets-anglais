# Refonte Astro — le socle (Niveau 0)

> Branche `refonte-astro`, 23 août 2026. `main` = prod intacte jusqu'au merge.

## Ce qui change, ce qui ne change pas

| | Avant | Après |
|---|---|---|
| Source d'un carnet | `_specs/*.json` (local, gitignoré) + générateur Python `worksheet-b1` | `src/content/carnets/<classe>--<slug>.json` (versionné) + build Astro |
| HTML des carnets | committé, 1 fichier autonome par carnet (CSS+JS dupliqués ×19) | généré au build dans `dist/`, design et moteur **partagés** |
| URLs | `/carnets-anglais/<classe>/<slug>/` | **identiques** |
| Code `GTEST1` | `template.html` | `public/assets/carnet-engine.js` — **identique** (prouvé par `npm test`) |
| `platform.js` (API, roster, sons, menu maison) | `assets/platform.js` | `public/assets/platform.js` — **inchangé** |
| Serveur `carnets-api` | — | **rien ne change** |
| Déploiement | Actions publie la racine de `main` | Actions construit (`npm run build`) et publie `dist/` |
| Design | 4 palettes fixes | design de `_rebuild/mockup.html` : 6 skins, bulles glass, paillettes, mascotte, karaoké, dico au tap |

## Le gate GTEST1 (`npm test`)

`tests/gtest1-diff.mjs` charge, pour chacun des 19 carnets, la page **prod de référence** (`tests/golden/`,
copie figée de `main` avant la bascule) et la page **Astro** (`dist/`) dans jsdom, remplit les mêmes réponses
selon 4 motifs (tout juste · tout faux · mixte 2/3 · avec blancs), valide chaque section, clique
« Check my answers », décode les deux codes et les compare (hors `date`/`submitted`).
**19 carnets × 4 motifs = 76 comparaisons, toutes identiques.** Le test tourne aussi dans le workflow.

Quirks de prod volontairement reproduits (les stats serveur agrègent dessus) :
- `test_name` part **tel quel** : les carnets générés contiennent `&amp;`, les faits main `&` → stocké verbatim.
- ids d'items historiques (`m_1`, `g_1`…) → `section.id_prefix` ; thème **par item** → `item.theme`.
- nom de section complet (`"B1 Perfect/Past"`, ou juste `"Passive"` sur le B2) → `section.name`.

## Architecture de la page

```
Carnet.astro (coquille)            ┐
  ├─ hero · identité · histoire    │ rendu au build depuis la fiche JSON
  ├─ cartes d'exercice (<select>)  │
  └─ bannière résultat             ┘
  window.CARNET = {test, ans, sections, theme, ps, audio, glossary}   ← données du moteur (inline)
  carnet-engine.js   note /20, gate par section, code GTEST1 → émet carnet:item / :section / :submit / :reset
  platform.js        envoi auto à l'API, roster, sauvegarde locale, sons Cuelume, menu maison des <select>
  carnet-ui.js       skins, avatars, paillettes, mascotte, karaoké, dico au tap — écoute les événements du moteur
```

Principe : **le moteur ne fait aucun effet visuel** ; la couche design réagit aux événements. On peut changer
tout le design sans toucher à une ligne du moteur (et donc sans risque pour le code).

## Décisions prises pendant la construction

- **Réponses = menus déroulants + « Validate » par section** (comme la prod), restylés en pilules glass.
  La maquette montrait des pilules « un tap = corrigé tout de suite » : c'est un autre modèle pédagogique
  (une seule tentative, pas de validation de section) qui casserait le contrat de `platform.js`
  (`.card select`, `[data-act=validate]`). → candidat **Niveau 1**, à décider.
- Les paillettes « par bonne réponse » tombent **à la validation de la section**, une par bonne réponse en cascade
  (✨), 🎉 si section parfaite, 🏆 à la fin. Sons = ceux de `platform.js` (sparkle/bloom par section) ; pas de
  son par réponse (à revoir si on passe aux pilules).
- `⚙️ Son` pilote la préférence mute de `platform.js` (`carnet_sound_off`) ; son bouton flottant est masqué.
- Le panneau « enregistré · Ma progression » de `platform.js` s'affiche **au-dessus** de la barre de statut ;
  la mascotte remonte tant qu'il est visible.
- `palette` (green/violet/blue/amber) reste dans le schéma mais **n'est plus utilisée** : le skin est le choix de l'élève.
- Carnet sans histoire (ELEC B2) : `story: []` + `intro` (consigne sous le hero).
- `elec/transformer-failure` (workbook imprimable, hors moteur) est servi tel quel depuis `public/`.
- Le hub `index.html` et `stats.html` sont servis tels quels depuis `public/` (refonte du hub = Niveau 1).

## Bascule (quand on décide)

1. `npm run build && npm test` en local → tout vert.
2. Merge `refonte-astro` → `main` : le workflow remplace l'ancien (Pages est déjà en mode « GitHub Actions »).
3. Vérifier en ligne : un carnet, le roster, un envoi réel, `stats.html`.
4. Retour arrière = revert du merge (l'ancien workflow republie la racine).

## Reste à faire (Niveau 1)

- Header/footer « utiles » : carnet de bord **local** (erreurs par thème, stats, Mon vocabulaire — déjà stocké
  dans `localStorage.carnet_vocab`), vue Banque/hub en Astro.
- Avatars DiceBear auto-hébergés (RGPD/offline) ; voix karaoké pour les 18 autres carnets (`_rebuild/build-audio.mjs`).
- Décider pilules instantanées vs menus + validation.
