# Anatomie d'un carnet — structure, fiche source, générateur

Un « carnet » est **une seule page HTML autonome** (`<classe>/<slug>/index.html`) qui contient tout :
le texte, les exercices, le moteur de correction, le style. On ne l'écrit pas à la main : on décrit son
**contenu** dans une fiche JSON, et un **générateur** fabrique le HTML.

---

## 1. La structure visible (de haut en bas)

| Bloc | Ce que c'est |
|---|---|
| **Hero** | Le bandeau de titre : pastille de classe, gros titre, niveau (A1–A2 … B1–B2). Fond dégradé animé + emojis flottants (voir [`animations.md`](animations.md)). |
| **Barre d'identité** | Le **nom** de l'élève (`#stuName`, remplacé par un menu déroulant si la classe a un roster) et sa classe. C'est ce nom qui attribue le résultat. |
| **Barre de progression** | Se remplit au fur et à mesure des réponses (« 12 / 48 ✍️ »). |
| **Histoire (`story`)** | Un court texte de métier (l'entrepôt, l'atelier, le magasin…) avec le **vocabulaire clé surligné**. C'est le support de lecture. |
| **Sections d'exercices** | Une suite de **cartes**, chacune un exercice (vocabulaire, grammaire, traduction…). Détail ci-dessous. |
| **Fin de carnet** | La **note /20**, le récap par thème, et le **code `GTEST1`** (aujourd'hui envoyé automatiquement, plus besoin de le copier). |

Chaque **section** = une carte colorée avec un code (`A1`, `B2`…), un titre, une consigne, et des items.
Les réponses se font surtout par **menus déroulants** (choisir la bonne option), plus quelques champs.
À la validation, la carte devient verte (juste) ou signale les erreurs (voir animations).

---

## 2. La fiche source `_specs/<nom>.json`

C'est **la vraie source** d'un carnet : on y décrit le contenu, pas le HTML. Exemple (extrait réel de
`gtla_welcome_warehouse.json`) :

```json
{
  "output": ".../gtla/welcome-warehouse/index.html",   // où écrire le HTML généré
  "title": "📦 Welcome to the Warehouse — GTLA 1",
  "palette": "green",                                    // couleur d'ambiance du carnet
  "hero_pill": "BTS GTLA 1 · TRANSPORT & LOGISTICS",
  "hero_h1": "Welcome to<br>the Warehouse 📦",
  "level": "A1–A2",
  "class": "GTLA 1",
  "test_name": "GTLA1 Welcome to the Warehouse (A1-A2)",  // apparaît dans le code GTEST1
  "story": [ "Karim is a logistics apprentice…", "…", "…" ],
  "sections": [
    {
      "code": "A1", "name": "Match", "heading": "Match the word & the meaning",
      "icon": "🧩", "color": "c-pink", "theme": "Vocabulaire", "points": 8,
      "pool": ["warehouse", "forklift", "…"],
      "items": [ { "text": "a big building where goods are stored → ___", "answer": "warehouse" } ]
    },
    {
      "code": "B2", "name": "Modals", "heading": "Safety rules — must / mustn't",
      "theme": "Modaux — obligation/interdiction", "points": 8,
      "items": [ { "text": "You ___ wear a safety vest.",
                   "options": ["must","mustn't","don't have to"], "answer": "must" } ]
    }
  ]
}
```

Champs importants d'une **section** :

- `code` / `name` / `heading` : l'étiquette, le type d'exercice, la consigne.
- `theme` : **la notion travaillée** (ex. `Vocabulaire`, `Present perfect vs prétérit`, `Modaux`). C'est
  ce qui alimente le récap par thème et l'index de grammaire ([`carnets-et-grammaire.md`](carnets-et-grammaire.md)).
- `points` : combien vaut la section (le total des sections donne la note /20).
- `color` : la couleur de la carte (`c-pink`, `c-mint`, `c-sun`, `c-sky`… voir [`design.md`](design.md)).
- `items` : les questions. Une bonne réponse = `answer` ; plusieurs réponses acceptées = `answers: [...]` ;
  choix fermés = `options: [...]`.

> Les `_specs/*.json` sont **la mémoire régénérable** des carnets. Ils sont aujourd'hui en local
> (gitignorés) ; pour qu'un successeur puisse recréer un carnet, ce sont eux qu'il faut lui donner.

---

## 3. Le générateur `worksheet-b1`

`worksheet-b1` est le **compétence/outil** qui transforme une fiche `_specs/*.json` en page HTML finie
(story + exercices + moteur de correction /20 + code `GTEST1` + export PDF). On **n'édite jamais le HTML
d'un carnet à la main** : on modifie la fiche JSON puis on régénère.

Fabriquer / modifier un carnet, en résumé :

```
1. écrire/éditer  _specs/<nom>.json     (le contenu)
2. lancer le générateur worksheet-b1     → écrit <classe>/<slug>/index.html
3. commit + push                          → en ligne (~30 s, GitHub Pages)
```

Le générateur pose aussi automatiquement le **code `GTEST1`** (le résultat compressé) et branche le
carnet à `assets/platform.js` (envoi auto). D'autres compétences fabriquent d'autres supports (ex.
`trade-show-pack` pour les activités orales), mais **les carnets auto-corrigés passent par `worksheet-b1`**.

---

## 4. Le code `GTEST1` (le lien avec le serveur)

À la validation, le carnet calcule tout et fabrique une ligne :

```
GTEST1::eyJ0ZXN0Ij…   (le résultat complet : nom, note /20, score, détail par thème et par question)
```

`platform.js` l'envoie tout seul au serveur. Le détail de ce code et de son traitement (flux complet,
modèle de données) est dans [`architecture.md`](architecture.md) §2 et §4.

---

## À retenir

- Un carnet = **1 page HTML autonome**, générée depuis **1 fiche JSON**.
- La fiche `_specs/*.json` est la **source** ; le HTML est **jeté et régénérable**.
- On modifie le **contenu** (JSON) et on **régénère**, jamais le HTML à la main.
- Le champ `theme` de chaque section est la clé du suivi pédagogique par notion.
