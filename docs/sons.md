# Sons & menu « maison »

Le **retour sonore** de la plateforme et le **menu déroulant custom** des réponses. Tout vit dans
`assets/platform.js` (donc actif sur **tous les carnets** sans toucher au HTML généré), **sans
aucun fichier audio ni dépendance**.

---

## 1. Le moteur de sons

Portage en JavaScript vanilla de la palette **Cuelume** (Web Audio API). Les **14 sons** sont
**synthétisés en direct** (oscillateurs + bruit filtré + un léger *shimmer*) — d'où « aucun
fichier ». Noms : `chime, sparkle, droplet, bloom, whisper, tick, press, release, toggle, success,
error, page, loading, ready`.

API interne exposée : `window.CarnetSound.play(nom)`, `.setEnabled(bool)`, `.sounds`.

## 2. Carte des sons (branchée sur les événements existants)

| Événement | Son |
|---|---|
| Survol d'un bouton / d'un menu (souris) | `whisper` |
| Ouvrir un menu de réponse | `press` |
| Survoler un choix dans le menu | `tick` |
| Choisir une réponse | `tick` |
| Valider une section **avec erreur(s)** | `bloom` |
| Valider une section **100 % juste** | `sparkle` |
| Carnet terminé (code `GTEST1` apparaît) | `success` |
| Reset / PDF | `page` |

Le **100 %** est détecté sur le signal que pose le carnet lui-même : bouton `done` /
« ✓ Perfect! » (repli : aucune réponse `.incorrect` dans la carte).

## 3. Le menu « maison » des réponses

**Pourquoi.** Un `<select>` **natif** ouvre un menu dessiné par l'OS : survoler chaque choix
n'émet aucun événement JS → impossible d'y mettre un son. On **supprime le popup natif** (souris
uniquement) et on affiche une **liste HTML** à la place.

**Sans casser la note.** Le `<select>` **reste l'élément visible et la source de vérité** :
couleurs juste/faux (`.correct`/`.incorrect`), verrouillage (`disabled`), et calcul du `/20` sont
inchangés. Choisir un item ne fait que **poser la valeur du `<select>` et émettre `change`**.

**Détails qui ont demandé un correctif :**
- **Toutes les options visibles** : le panneau s'adapte à la place à l'écran (bascule au-dessus si
  besoin) et n'a pas de plafond qui cacherait une réponse (le carnet mélange l'ordre des options).
- **Sélection au relâchement** : les items écoutent **`mouseup`**, pas `click` — pour permettre le
  geste d'un menu natif (presser le select, glisser jusqu'au mot, relâcher).
- **Tactile** : on garde le menu **natif** (meilleur au doigt).
- **Clavier** : ↑ ↓ pour naviguer (avec son), Entrée valide, Échap ferme.

## 4. Le bouton mute

Bouton flottant (haut-droite), **icône SVG signalétique** (haut-parleur, barré en rouge quand
muet — pas d'emoji). Préférence **mémorisée** par navigateur (`localStorage: carnet_sound_off`).

## 5. Garde-fou : l'amorçage
Au rechargement, `platform.js` **restaure** l'état (re-clique les sections validées, re-remplit les
réponses). Un délai d'**amorçage (2 s)** ignore ces événements pour éviter une **rafale de sons**,
et le `success` de fin ne joue que sur une **vraie** transition « vide → terminé ».

## 6. Où changer quoi
Tout est dans le bloc `sound()` à la fin de `assets/platform.js` :
- **timbre d'un son** → objet `RECIPES` ;
- **quel son sur quel geste** → les écouteurs délégués (`change`, `click [data-act]`, survol…) ;
- **son du 100 %** → branche `case "validate"` ;
- **icône / défaut activé** → `mountToggle()`.
