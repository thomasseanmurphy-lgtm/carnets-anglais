# Le front web — page d'accueil & `platform.js`

Ce document couvre tout ce qui tourne **dans le navigateur de l'élève**, côté site (pas le serveur).
Trois pièces : la **page d'accueil** (le hub), le **tuyau** `platform.js` ajouté à chaque carnet,
et l'**outil prof** `stats.html`.

---

## 1. La page d'accueil `index.html` (le « hub »)

C'est la page derrière le **lien unique** partagé aux élèves
(`https://thomasseanmurphy-lgtm.github.io/carnets-anglais/`). Son seul rôle : **aiguiller** l'élève
vers son carnet. Elle ne contient aucune donnée d'élève.

### Navigation à deux niveaux (menus déroulants)

L'élève **choisit d'abord son centre**, puis sa classe, puis le carnet :

```
🏭 UIMM  ▾            ← centre (replié par défaut)
   🛠️ BTS CPRP  ▾     ← classe (repliée)
       ♻️ Recycling Drive   ← carnet (un lien)
       …
🎓 AFTRAL  ▾
   🚚 BAC PRO (Théo) ▾
       …
```

- Un **centre** = `<section class="centre" data-centre="uimm">`. Son en-tête est un bouton dépliable.
- Une **classe** = `<section class="class" data-cls="cprp">`, imbriquée dans le centre.
- Un **carnet** = `<a class="chap" href="cprp/recycling-drive/">`.

Le repli/dépli se fait en CSS (voir [`animations.md`](animations.md) → « accordéons »). Chaque en-tête
porte un **compteur** de carnets ; un centre additionne les carnets de ses classes.

### Ce que la page retient (mémoire du navigateur)

Tout est stocké en **`localStorage`** (mémoire locale du navigateur de l'élève, pas sur un serveur) :

| Clé `localStorage` | Rôle |
|---|---|
| `carnet_centre_open_<centre>` | centre déplié (`1`) ou replié (`0`) — retrouvé au retour |
| `carnet_class_open_<classe>` | idem pour une classe |
| `carnet_done_<classe>_<slug>` | carnet **terminé** → badge vert « ✓ Fait » + liseré vert |
| `carnet_started_<classe>_<slug>` | carnet **commencé** → badge « En cours » |

Le petit script en bas de `index.html` lit ces clés pour : afficher les **badges** de progression sur
chaque carnet, remplir les **compteurs** d'en-tête, et rouvrir les sections comme l'élève les avait
laissées. Le bouton **« Tout dérouler / Tout replier »** agit sur les centres **et** les classes.

> Important : cette progression sur l'accueil est **locale à l'appareil**. Le vrai suivi (celui que tu
> vois côté prof) vient du **serveur**, alimenté par `platform.js` (ci-dessous).

---

## 2. `assets/platform.js` — le « tuyau » de chaque carnet

Un seul fichier, ajouté à **tous les carnets auto-corrigés**. Il ne modifie pas le carnet : il **greffe**
dessus quatre comportements. Il **devine la classe et le carnet** depuis l'adresse de la page
(`…/cprp/recycling-drive/` → classe = `cprp`, carnet = `recycling-drive`).

### a) Menu déroulant des noms (roster)

Au chargement, il demande au serveur la liste des noms de la classe
(`GET /api/roster?class=<classe>`). **Si** une liste existe, il **remplace** le champ « nom » libre
(`#stuName`) par un menu déroulant peuplé des élèves + une option « — Autre / absent de la liste — ».
S'il n'y a pas de liste, le champ libre reste. C'est ce qui garantit **un seul profil par élève** et un
suivi propre sur l'année. (Rollout par classe : voir la task list du projet.)

### b) Envoi automatique du résultat

Dès qu'un **code `GTEST1` valide** apparaît (l'élève a validé son carnet), le résultat **part tout seul**
vers `POST /api/submit` — **aucun bouton**. L'élève voit « ✅ Progression enregistrée (x/20) » puis le
seul lien utile : **« 📊 Voir ma progression »**. Garde-fous :

- `carnet_sentcode_<classe>_<slug>` : évite de **recompter un essai** si l'élève rouvre un carnet déjà envoyé.
- En cas de coupure réseau : bouton **« 🔄 Réessayer »**.
- Si le nom manque : message « Choisis ton nom en haut… » (pas de boucle d'envoi).

### c) Signalement de connexion (« visite »)

Dès que le nom est connu, le carnet signale au serveur « cet élève a ouvert ce carnet »
(`POST /api/visit`), **au plus 1×/jour/carnet/élève** (anti-doublon via `carnet_visit_…` en local).
C'est ce qui alimente la colonne **« Vu »** du tableau prof (un élève qui se connecte sans rien rendre
apparaît quand même).

### d) Sauvegarde locale (ne rien perdre)

Toutes les réponses sont sauvegardées en continu dans `carnet_state_<classe>_<slug>` et **restaurées**
si l'élève revient sur un carnet inachevé — y compris les sections déjà validées (re-verrouillées vertes).
C'est indépendant du serveur : ça marche même hors ligne.

### e) Nettoyages d'interface

`platform.js` **masque** les anciens boutons devenus inutiles (« Copier mon code », « Envoyer par mail »)
et **cache la barre du bas** tant que le carnet n'est pas fini (voir [`animations.md`](animations.md)
→ « barre du bas »).

---

## 3. `stats.html` — l'outil prof (secours)

Page prof accessible par un lien discret en bas du hub. On y **colle des codes `GTEST1::…`** (de
plusieurs élèves/classes) et elle produit une analyse : moyenne, réussite par thème, par question, par
élève. C'est l'outil **d'appoint / hors-ligne** ; le suivi principal en direct passe par le **tableau de
bord du serveur** (`/teacher`, décrit dans la doc socle).

---

## En un coup d'œil

| Pièce | Fichier | Rôle |
|---|---|---|
| Hub | `index.html` | aiguiller vers le bon carnet ; badges de progression locale |
| Tuyau | `assets/platform.js` | roster, envoi auto, visite, sauvegarde locale |
| Stats appoint | `stats.html` | analyser des codes collés à la main |

Le détail du **serveur** qui reçoit tout ça (`/api/submit`, base KV, tableau prof) est dans
[`architecture.md`](architecture.md). `platform.js` gère aussi le **retour sonore** et le menu
déroulant « maison » des réponses → [`sons.md`](sons.md).
