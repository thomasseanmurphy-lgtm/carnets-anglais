# Index des carnets & grammaire couverte

Deux choses ici : **la liste de tous les carnets** (par classe, niveau, adresse) et **les notions de
grammaire** que chacun travaille. La source d'autorité des notions d'un carnet, ce sont les champs
`theme` de ses sections dans `_specs/<nom>.json` (voir [`anatomie-carnet.md`](anatomie-carnet.md)).

---

## 1. Catalogue des carnets

Adresse d'un carnet = `https://…github.io/carnets-anglais/<classe>/<slug>/`.
Le tableau suit la page d'accueil actuelle (`index.html`).

### 🏭 UIMM — Pôle Formation Dijon

| Classe (`code`) | Carnet (`slug`) | Titre | Niveau |
|---|---|---|:--:|
| BTS MS (`ms`) | `crane-installation` | Heavy Lift & Installation | B1–B2 |
| | `insurance-audit` | The Insurance Audit | B1–B2 |
| BTS CPRP (`cprp`) | `cnc-machining` | CNC Machining & Quality | B1+ |
| | `qc-series` | Quality Control on a Series | B1+ |
| | `recycling-drive` | Machining Workshop — Recycling Drive | B1 |
| | `delivery-qc` | Delivery, Calibration & Quality Control | B1 |
| | `nuclear-series` | A New Series | A1–A2 |
| | `nuclear-series-2` | Workshop & Machines (No 2) | A1–A2 |
| BTS ELEC (`elec`) | `industrial-electrician` | Industrial Electrician | B1 |
| | `industrial-electrician-b2` | Industrial Electrician — B2 | B2 |
| | `automation-grafcet` | Automation & GRAFCET | B1–B2 |
| | `transformer-failure` | The Day the Transformer Failed *(lecture, sans note)* | B1 |

### 🎓 AFTRAL — Dijon

| Classe (`code`) | Carnet (`slug`) | Titre | Niveau |
|---|---|---|:--:|
| BAC PRO Logistique — Théo (`aftral`) | `theo-ch1` | Théo Ch.1 — Finding the Company | A2–B1 |
| | `theo-ch2` | Théo Ch.2 — The Interview | A2–B1 |
| BTS NDRC — Vente (`ndrc`) | `first-day-store` | First Day in the Store | A1–A2 |
| | `closing-the-deal` | Closing the Deal | B1–B2 |
| | `recruitment-drive` | The Recruitment Drive | B1–B2 |
| BTS GTLA — Transport (`gtla`) | `welcome-warehouse` | Welcome to the Warehouse | A1–A2 |
| | `late-shipment` | The Late Shipment | B1–B2 |
| | `delivery-route` | The New Delivery Route | B1–B2 |
| BTS Tourisme (`tourisme`) | — | *(carnets à venir)* | — |

> **⚠️ Note maintenance — dérive site ↔ serveur (à corriger).** Le serveur (`carnets-api`, constante
> `CLASSES`) tient aussi une liste de carnets. Elle sert aux **jolis titres** *et* au calcul du
> **`done/total`** de chaque élève — donc une dérive fausse les totaux (un élève peut voir « 4/2 »).
> Un carnet **fonctionne même s'il n'y est pas** (l'envoi utilise la classe + le slug lus dans l'URL),
> mais son total est faux. État actuel de la dérive :
> - **cprp** : manquent `cnc-machining`, `qc-series` ; contient encore `nuclear-series-engineer` (supprimé) ;
> - **elec** : manquent `automation-grafcet`, `transformer-failure`.
>
> À réaligner sur ce tableau dans `Carnets Anglais - API/src/index.js` → `CLASSES`, puis redéployer et
> « Recalculer » (voir [`exploitation.md`](exploitation.md)). Ce catalogue-ci est la **référence**.

---

## 2. Le référentiel des notions (thèmes)

Chaque section d'un carnet porte un `theme`. Le serveur normalise ces libellés (constante `THEMES`) pour
le récap « à réviser ». Les notions utilisées dans la plateforme :

| Famille | Notions (libellés `theme`) |
|---|---|
| **Vocabulaire** | Vocabulaire · Vocabulaire (texte à trous) · Adjectifs |
| **Temps** | Présent simple (affirmatif) · Present perfect vs prétérit · Temps (choix du temps) |
| **Modaux & formes** | Modaux · Forme négative · Questions / interrogation |
| **Structures** | Voix passive · Conditionnels · Comparatifs · Connecteurs logiques · For / To |
| **Communication** | Discours rapporté (reported speech) · Négociation (expressions) · Traduction |

C'est ce même référentiel qui permettrait de **classer/filtrer les carnets par notion** (piste notée
dans la task list du projet).

---

## 3. Grammaire par carnet (vérifiée)

Notions confirmées en lisant la fiche source. Pour les carnets non listés ici, la référence reste le
fichier `_specs/*.json` correspondant (champs `theme`).

| Carnet | Notions travaillées |
|---|---|
| `gtla/welcome-warehouse` | Vocabulaire · Présent simple · Modaux (must / mustn't) |
| `cprp/recycling-drive` | Vocabulaire · Present perfect vs prétérit · Traduction · Modaux · Comparatifs · Adjectifs |
| `elec/automation-grafcet` | Voix passive · Conditionnels (transitions) · Connecteurs logiques · Modaux — sécurité |

*(À compléter en lisant les autres `_specs`. Le plus propre serait de **générer** ce tableau — voir ci-dessous.)*

---

## 4. Éviter que cet index rouille (recommandation)

Aujourd'hui ce catalogue est tenu **à la main** → il se désynchronise dès qu'on ajoute un carnet. Le
plus propre : un petit **manifeste `carnets.json`** (`slug → { classe, titre, niveau, thèmes[] }`) qui
serait **la seule source**, et qui générerait à la fois cet index, la grammaire par carnet, et même la
page d'accueil. Les `theme[]` viendraient directement des `_specs/*.json`. (Recommandation, pas encore fait.)
