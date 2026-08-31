# Le contrat de build — ce qui ne doit jamais casser

> **Source de vérité des invariants du build.** Ce document dit *ce qui doit rester vrai* dans le HTML
> produit, *pourquoi*, et *comment on le vérifie*. Le déroulé de la refonte est dans
> [`refonte-astro.md`](refonte-astro.md), le fonctionnement général dans [`architecture.md`](architecture.md).
> Un fait = un seul endroit : ici, on ne redit pas comment la plateforme marche, on liste les règles.

Un carnet = **une fiche JSON** → **une page générée**. Entre les deux, un build. Chaque règle ci-dessous
existe parce qu'elle protège soit **la note de l'élève**, soit **les statistiques du prof**.

---

## La chaîne

```
src/content/carnets/<classe>--<slug>.json     LA SOURCE (versionnée)
        │  schéma Zod — src/content.config.ts
        ▼
npm run build      →  dist/<classe>/<slug>/index.html      (jetable, jamais committé)
        │
npm test           →  gate GTEST1 + sync karaoké           ← DOIT être vert
        │
git push main      →  .github/workflows/pages.yml rejoue build + test, publie dist/
```

**Règle d'or : on n'édite jamais le HTML d'un carnet à la main.** `dist/` est jeté à chaque build.

---

## Les invariants

### 1. Le code `GTEST1` ne bouge pas

Le serveur agrège les statistiques sur ce code. Si sa forme change, l'historique des élèves se scinde en deux.

- **Vérifié par** `npm test` → `tests/gtest1-diff.mjs` : 20 carnets × 4 motifs de réponses
  (tout juste · tout faux · mixte 2/3 · avec blancs) = **80 comparaisons**, chacune confrontée à la page
  de référence figée dans `tests/golden/`.
- **Ne jamais toucher** `public/assets/carnet-engine.js` sans relancer ce test.

### 2. `test_name` part **verbatim**

Certains carnets contiennent `&amp;`, d'autres `&`. Les stats groupent sur cette chaîne exacte : la
« corriger » scinderait un carnet en deux lignes de statistiques. → `src/content.config.ts`, champ `test_name`.

### 3. Les identifiants d'items sont stables et uniques

`itemId()` = `<id_prefix|code>_<n>` (`src/lib/carnet.ts:16`). Deux sections qui produisent le même préfixe
créent des `id` HTML en double : `getElementById` ne renvoie que le premier, et **l'exercice suivant serait
corrigé avec les réponses du précédent**. Les ids historiques (`m_1`, `g_1`…) sont conservés via
`section.id_prefix` pour ne pas casser les stats par item.

### 4. Les noms de section sont uniques

La validation cible le bouton par `[data-sec="<name>"]`. Deux sections homonymes = une section validée deux
fois, l'autre jamais. → `section.name`, écrit tel quel dans le code `GTEST1`.

### 5. Une bonne réponse existe toujours parmi les options

Contrôlé **au build**, pas à l'exécution : `superRefine` dans `src/content.config.ts:40` échoue la
compilation si `answer`/`answers` ∉ `options`/`pool`. La comparaison utilise le même `norm()` que le moteur
(`src/content.config.ts:14` ≡ `carnet-engine.js:25`) — apostrophes typographiques et ponctuation neutralisées.
`answers` (pluriel) sert aux variantes acceptées : `["haven't sorted", "have not sorted"]`.

### 6. La page résiste à la traduction automatique du navigateur

**C'est la règle la plus récente, et elle vient d'un vrai bug en production.**

Chrome propose systématiquement de traduire une page en anglais à un élève en locale française. Quand il
traduit, il **réécrit le texte affiché** — y compris celui des `<option>`.

- Un `<option>` **sans attribut `value`** voit `option.value` retomber sur son texte. Traduit, il renvoyait
  `"a recyclé"` là où le moteur attendait `"has recycled"` → `isCorrect()` échouait sur **tous** les items.
  Symptôme côté élève : *la bonne réponse passe en rouge*, sur tout le carnet, et seulement pour les élèves
  qui avaient accepté la traduction.
- **La règle** : chaque `<option>` porte un `value` explicite (`src/lib/carnet.ts:52`). Le texte peut être
  traduit, la valeur comparée reste l'anglais d'origine.
- **En complément** : `translate="no"` sur les `<select>`, sur la carte histoire (`#story`) et sur les
  `<ol>` d'exercices — un QCM d'anglais dont les choix sont traduits n'a plus d'objet, et une histoire
  traduite annule la compréhension écrite.
- **Volontairement laissé traduisible** : les consignes françaises (`p.instr`), les boutons et le chrome de
  la page. Elles sont rendues **hors** de la zone `translate="no"`.

> Corollaire à respecter dans le moteur : **ne jamais lire le texte d'une option**, seulement `el.value`
> (`carnet-engine.js:26`). Lire le texte ré-introduirait exactement le même bug.

### 7. Le moteur ne fait aucun effet visuel

`carnet-engine.js` note et émet des événements (`carnet:item`, `:section`, `:submit`, `:reset`) ;
`carnet-ui.js` écoute et anime. On peut refondre tout le design sans toucher au code qui calcule la note —
donc sans risque pour la note ni pour le gate.

---

## Avant de déployer

```bash
npm run build      # échoue si une fiche viole le schéma
npm test           # gate GTEST1 (80 comparaisons) + sync karaoké
```

Puis, une fois en ligne, vérifier sur un carnet réel : un envoi de résultat arrive bien dans le tableau de
bord prof, et le roster répond.

**Retour arrière** : revert du merge — le workflow republie la version précédente.

---

## Vérifications ponctuelles utiles

Ces contrôles ne sont pas (encore) automatisés ; ils se relancent à la main en cas de doute.

| Question | Comment |
|---|---|
| Des ids d'items en double ? | parcourir les fiches, recalculer `<id_prefix\|code>_<n>`, chercher les doublons |
| Des noms de section en double ? | idem sur `section.name` |
| Les options ont-elles bien un `value` ? | `grep -c '<option value=' dist/<classe>/<slug>/index.html` |
| Le carnet résiste-t-il à la traduction ? | en console : réécrire le `textContent` de toutes les options, répondre juste, valider — aucun item ne doit passer en rouge |

*Bons candidats à ajouter un jour dans `tests/`.*
