# Animations & interactions

Toutes les animations sont en **CSS** (transitions et `@keyframes`), plus quelques bascules de classe en
JavaScript. Aucune bibliothèque d'animation. Voici chaque effet, où il vit, et à quoi il sert.

---

## 1. Sur la page d'accueil (`index.html`)

### Accordéons repli/dépli (centre → classe)
Le contenu d'un centre ou d'une classe s'ouvre en **glissant sa hauteur de 0 à sa taille naturelle**,
sans à-coup. Astuce CSS moderne : une **grille** dont la ligne passe de `0fr` à `1fr`.

```css
.centre-body{display:grid;grid-template-rows:0fr;transition:grid-template-rows .3s ease;}
.centre.open .centre-body{grid-template-rows:1fr;}      /* .open ajouté au clic */
.centre-body-inner{overflow:hidden;min-height:0;}
```

Les classes utilisent le même mécanisme (`.chaps` / `.class.open .chaps`, `.28s`). Le JS ne fait
qu'**ajouter/retirer `.open`** et mémoriser l'état dans `localStorage`.

### Chevron qui pivote
La flèche ▾ tourne de −90° (fermé) à 0° (ouvert) :
```css
.chev{transform:rotate(-90deg);transition:transform .28s ease;}
.class.open .chev{transform:rotate(0);}
```
(idem `.chev-c` pour les centres.)

### Cartes de carnet
Au survol, la carte **se soulève** légèrement et son ombre grandit :
`a.chap:hover{transform:translateY(-2px);box-shadow:…}` (`transition:.15s`).

---

## 2. Dans un carnet (`<slug>/index.html`)

### Fond dégradé animé (`bgshift`)
Le fond multicolore **se déplace lentement** en boucle (22 s) — effet « respiration » :
```css
body{background:linear-gradient(125deg,#e6fff0,#e4f6ff,#f3ffe0,#e8fff4);
     background-size:400% 400%;animation:bgshift 22s ease infinite;}
@keyframes bgshift{0%{background-position:0% 50%;}50%{background-position:100% 50%;}100%{…}}
```

### Emojis flottants (`float1` / `float2`)
Quatre emojis de décor (`.deco`) **flottent** doucement (montée/descente + rotation), à des vitesses
différentes (8–13 s), en fond translucide (`opacity:.35`). Purement décoratif (`pointer-events:none`).

### Réaction bonne / mauvaise réponse (`pop2` / `shake`)
À la validation d'une section, chaque menu déroulant réagit :
```css
select.correct{background:#e2fbf1;border-color:var(--green);animation:pop2 .4s ease;}   /* petit « pop » */
select.incorrect{background:#ffe6e9;border-color:var(--red);animation:shake .4s ease;}   /* tremblement */
```
Vert + pop = juste ; rouge + secousse = faux. Feedback immédiat et non culpabilisant.

### Barre de progression
La jauge `.bar` **se remplit** (largeur en %) au fur et à mesure que l'élève répond, avec le compteur
« 12 / 48 ✍️ ». Mise à jour par le moteur du carnet à chaque réponse.

---

## 3. La barre du bas (pilotée par `platform.js`)

Deux comportements liés au [tuyau `platform.js`](plateforme-web.md) :

- **Masquée pendant l'exercice.** La barre d'actions du carnet (`.bar`) reste **cachée tant que toutes
  les réponses ne sont pas remplies**. `platform.js` ajoute la classe `sections-done` au `body` quand
  c'est bon :
  ```css
  body:not(.sections-done) .bar{display:none !important;}
  ```
  → l'élève n'est pas distrait par des boutons tant qu'il n'a pas fini.
- **Panneau « progression » qui apparaît.** Quand le carnet est validé (code `GTEST1` prêt), un bandeau
  fixe en bas **apparaît** avec « ✅ Progression enregistrée » et le bouton « 📊 Voir ma progression ».
  Créé et affiché par `platform.js` (`#platformBar`, `display:none → flex`).

---

## 4. Principes d'animation (le pourquoi)

- **Douceur et lenteur** : transitions courtes (.15–.4 s) pour l'interaction, longues (8–22 s) pour l'ambiance.
- **Chaque animation dit quelque chose** : pop = réussi, shake = à revoir, glissement = « ça s'ouvre »,
  apparition de la barre = « c'est fini, c'est enregistré ».
- **Rien ne bloque** : les décors sont `pointer-events:none` ; les animations n'empêchent jamais de répondre.
- **Sobriété à l'accueil, jeu dans le carnet** : cohérent avec les deux identités de [`design.md`](design.md).

---

## Où changer quoi

| Effet | Endroit |
|---|---|
| Vitesse d'ouverture des accordéons | `index.html` → `transition:grid-template-rows .3s` (centres) / `.28s` (classes) |
| Vitesse du fond animé | carnet → `animation:bgshift 22s …` |
| Pop / shake des réponses | carnet → `@keyframes pop2` / `@keyframes shake` (mieux : le template `worksheet-b1`) |
| Quand la barre du bas apparaît | `assets/platform.js` → logique `sections-done` |
