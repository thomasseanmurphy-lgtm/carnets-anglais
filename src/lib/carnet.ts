import type { CollectionEntry } from 'astro:content';

type Carnet = CollectionEntry<'carnets'>['data'];
type Section = Carnet['sections'][number];

/** échappe un texte brut pour l'HTML (options de menus, titres) — pas le texte des items (HTML autorisé) */
export function esc(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** préfixe des ids d'items d'une section (même règle que le générateur + override prod) */
export function idPrefix(sec: Section): string {
  return sec.id_prefix || sec.code.toLowerCase().replace(/\//g, '').replace(/ /g, '');
}

export function itemId(sec: Section, i: number): string {
  return `${idPrefix(sec)}_${i + 1}`;
}

export function answersOf(item: Section['items'][number]): string[] {
  return item.answers ?? (item.answer !== undefined ? [item.answer] : []);
}

/** les 3 blocs de données du moteur (ANS / SECTIONS / THEME) + le nom de test — ce qui fait le code GTEST1 */
export function engineData(c: Carnet) {
  const ans: Record<string, string[]> = {};
  const theme: Record<string, string> = {};
  const sections: { name: string; ids: string[] }[] = [];
  for (const sec of c.sections) {
    const ids: string[] = [];
    sec.items.forEach((it, i) => {
      const id = itemId(sec, i);
      ids.push(id);
      ans[id] = answersOf(it);
      theme[id] = it.theme || sec.theme || sec.name;
    });
    sections.push({ name: sec.name, ids });
  }
  return { test: c.test_name, ans, sections, theme, ps: { title: c.ps_title, sub: c.ps_sub } };
}

/** sérialisation sûre dans un <script> inline (pas de </script> ni de <!-- possibles) */
export function inlineJson(v: unknown): string {
  return JSON.stringify(v).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

/** HTML d'un menu déroulant d'item (option vide en tête, puis les options dans l'ordre de la fiche ; le moteur mélange au chargement)
    `value` explicite + `translate="no"` : sans eux, la traduction automatique du navigateur (Chrome propose
    systématiquement de traduire une page en anglais) réécrit le texte des options — et comme `option.value`
    retombe sur le texte quand l'attribut manque, le moteur comparait du français à une réponse anglaise
    et comptait TOUTES les réponses fausses. */
export function selectHtml(id: string, options: string[], wide: boolean): string {
  const opts = '<option value=""></option>' + options.map((o) => `<option value="${esc(o)}">${esc(o)}</option>`).join('');
  return `<select${wide ? ' class="wide"' : ''} id="${id}" translate="no">${opts}</select>`;
}

/** HTML d'une ligne d'item : le texte (HTML autorisé) avec ___ remplacé par le menu */
export function itemHtml(sec: Section, i: number): string {
  const it = sec.items[i];
  const options = sec.pool ?? it.options ?? [];
  const sel = selectHtml(itemId(sec, i), options, sec.wide);
  return it.text.includes('___') ? it.text.replace('___', sel) : `${it.text} ${sel}`;
}

/** total d'items (la note /20 est proportionnelle) */
export function totalItems(c: Carnet): number {
  return c.sections.reduce((n, s) => n + s.items.length, 0);
}
