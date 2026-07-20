# Archiver la progression d'un élève quand son nom sort de la liste

> **Statut : idée, non construite.** Note de cadrage pour une évolution future — pas de code ici.

## Le besoin
Pouvoir **conserver la progression complète d'un élève** sur la plateforme **une fois son nom
retiré du roster** (fin de trimestre / d'année / départ). Aujourd'hui, retirer un nom du roster ne
supprime rien, mais l'élève « tombe hors liste » dans le tableau prof, sans démarche d'archivage
propre. Il manque un geste explicite : *sortir de la liste active* **tout en gardant une trace
consultable**.

## Pourquoi ça compte
C'est le pendant du **renouvellement de contingent** (chaque trimestre / année). Sans archivage :
- soit on **garde** les anciens dans la liste active → elle enfle et se brouille ;
- soit on **`reset`** la classe → on perd l'historique de la promo précédente.
On veut une **troisième voie** : geler proprement une promo/un élève et pouvoir y revenir.

## Contraintes déjà connues (à ne pas oublier au moment de construire)
- **L'identité dérive du nom** : `studentId = normId(classId, name)` (voir
  [`../docs/architecture.md`](../docs/architecture.md) §3). Un archivage ne doit pas dépendre d'une
  orthographe stable au point de se casser à la moindre correction.
- **Les données existent déjà en KV** : `idx:<studentId>` (résumé) + `sub:…` (historique, TTL
  ~400 j) + le cache `dash` + `roster:<classe>`. L'archivage travaillerait sur ces clés.
- **`/api/reset` existe** : il efface les résultats d'une classe **en gardant le roster** — brique
  proche, mais l'inverse de ce qu'on veut (on veut garder les résultats).
- **La question des promos n'est pas tranchée** : réutiliser `cprp` vs `cprp-2026`. Le choix
  conditionne la forme de l'archivage. (À décider avant de construire — voir
  [`../docs/exploitation.md`](../docs/exploitation.md).)

## Pistes (à départager plus tard, non retenues)
- **Statut « archivé » par élève** : un drapeau sur `idx:<studentId>` (ex. `archived: true` +
  date). L'élève disparaît du direct mais reste exportable/consultable. Simple, réversible.
- **Espace d'archive par promo** : recopier les `idx:`/`sub:` d'une promo sous un préfixe figé
  (ex. `archive:cprp:2025-2026:*`) puis nettoyer la classe active. Plus lourd, mais fige vraiment.
- **Export = archive** : considérer que l'export CSV/JSON *est* l'archive, et ne garder en ligne
  que la promo active. Le plus simple ; à voir si « consultable en ligne » est requis.

## Questions ouvertes
- L'archive doit-elle rester **consultable en ligne** (page « Ma progression » de l'ancien élève),
  ou un **export suffit** ?
- Archivage **par élève** (départ individuel) ou **par promo** (bascule annuelle) — ou les deux ?
- Faut-il d'abord un **identifiant stable** par élève (au lieu du nom) pour que l'archive survive
  aux corrections d'orthographe ?

## Lié
- [`../docs/exploitation.md`](../docs/exploitation.md) — roster, reset, renouveler un contingent.
- [`../docs/architecture.md`](../docs/architecture.md) — identité `normId`, modèle KV.
