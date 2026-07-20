# Design — le système visuel

La plateforme a **deux identités** volontairement différentes :

- **La page d'accueil (`index.html`)** : sobre, calme, « utilitaire » — c'est un aiguillage, il doit être
  lisible et rapide.
- **Les carnets** : ludiques, colorés, ronds — police ronde, fonds animés, emojis flottants — pour que
  l'exercice soit accueillant (niveaux A1 à B2, souvent des élèves peu à l'aise en anglais).

Tout est écrit en **CSS pur, dans chaque fichier** (pas de framework, pas de fichier CSS externe). Chaque
page est autonome.

---

## 1. Identité « accueil » (le hub)

Définie dans `index.html`. Palette sobre vert/eau :

```css
:root{
  --ink:#16332a;    /* texte principal */
  --muted:#5f6a75;  /* texte secondaire */
  --accent:#127a55; /* vert d'accent (titres de classe, liens) */
  --faint:#9aa6b2;  /* gris clair (compteurs, sous-titres) */
}
/* fond de page : dégradé doux */
background:linear-gradient(135deg,#eafff4,#eafaff);
```

- **Police** : `system-ui` (la police native du téléphone/ordi) — neutre, rapide.
- **En-tête de centre** (UIMM/AFTRAL) : bouton pleine largeur, **dégradé** `var(--accent) → #38bdf8`,
  texte blanc, coins arrondis 14 px.
- **Carte de carnet** (`a.chap`) : fond blanc, coins 18 px, ombre douce `rgba(40,90,70,.12)`, léger
  soulèvement au survol.
- **Badges de progression** : ✓ Fait = vert plein `#2e9e6e` ; En cours = ambre `#fdf0d8` / `#c8871f` ;
  liseré gauche de la carte vert (fait) ou ambre (commencé).

---

## 2. Identité « carnet »

Définie dans chaque `<classe>/<slug>/index.html`. Palette vive, à **variables** :

```css
:root{
  --ink:#20303a;
  --grape:#2f9e6f; --grape-d:#1e7a52;   /* couleur de base (varie selon la palette du carnet) */
  --pink:#f0803c; --sun:#ffc93c; --mint:#37d9a0; --sky:#38bdf8;  /* accents des cartes */
  --card:#ffffff; --soft:#eafaf1;
  --red:#ff5a6e; --green:#20c997;        /* faux / juste */
}
```

- **Polices** (Google Fonts) : **Baloo 2** (ronde, grasse) pour les **titres, pastilles, boutons** ;
  **Nunito** pour le **texte courant**. Importées en haut du fichier.
- **Fond de page** : dégradé multicolore **animé** (voir [`animations.md`](animations.md) → `bgshift`).
- **Hero** (bandeau titre) : dégradé `--grape → --sky`, coins 30 px, grosse ombre colorée, un **emoji
  filigrane** géant en fond, le niveau dans une pastille jaune `--sun`.
- **Palettes** : le champ `palette` de la fiche `_specs` (ex. `"green"`) choisit le jeu de couleurs de
  base du carnet, pour varier l'ambiance d'un métier à l'autre.

### Les composants récurrents d'un carnet

| Composant | Aspect |
|---|---|
| **Pastille** (`.pill`) | étiquette de classe en Baloo 2, fond translucide, arrondi total |
| **Puces d'identité** (`.chip`) | nom + classe, dans des « bulles » blanches |
| **Barre de progression** (`.track` + `.bar`) | jauge qui se remplit selon les réponses |
| **Carte de section** | une couleur par exercice via `--pink / --mint / --sun / --sky` (classes `c-pink`, `c-mint`, `c-sun`, `c-sky`) |
| **Menus déroulants** (`select`) | « fun selects » arrondis ; deviennent **verts** (juste) ou **rouges** (faux) à la validation |
| **Pied** (`.foot`) | rappel du titre + « self-marking » |

---

## 3. Le langage visuel commun (les deux mondes)

- **Coins très arrondis** partout (14–30 px) : douceur, ton non-scolaire.
- **Ombres colorées** plutôt que grises (teintées vert/bleu selon le fond).
- **Emojis** comme repères de sens (pas décoratifs seulement) : 🏭 UIMM, 🎓 AFTRAL, ♻️ recyclage, 🚛 transport…
- **Dégradés** vert → bleu ciel (`#38bdf8` revient partout) = la couleur signature de la plateforme.
- **Feedback couleur** : vert = juste/fait, ambre = en cours, rouge = faux. Jamais de rouge « punitif »
  ailleurs.

---

## 4. Où changer quoi

| Je veux changer… | Où |
|---|---|
| Les couleurs de l'accueil | bloc `:root{…}` en haut de `index.html` |
| Le style d'une carte de carnet à l'accueil | règle `a.chap` dans `index.html` |
| Les couleurs / la police d'un carnet | bloc `:root{…}` + `@import` en haut du `<slug>/index.html` (mais mieux : régénérer via `worksheet-b1`) |
| La couleur d'une section d'exercice | champ `color` de la section dans `_specs/<nom>.json` |

> Comme les carnets sont **générés** (voir [`anatomie-carnet.md`](anatomie-carnet.md)), le vrai endroit
> pour un changement de fond sur **tous** les carnets, c'est le **template du générateur `worksheet-b1`**,
> pas chaque fichier à la main.
