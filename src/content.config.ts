import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/* ----------------------------------------------------------------------------
   Fiche d'un carnet (src/content/carnets/<classe>--<slug>.json)
   = l'ancien « spec » du générateur worksheet-b1, avec 3 ajouts issus de la prod :
     - section.name      = nom COMPLET tel qu'il part dans le code GTEST1 (« B1 Perfect/Past »)
     - section.id_prefix = préfixe des ids d'items quand il diffère du code (« m_1 » au lieu de « a1_1 »)
     - item.theme        = thème par item quand il diffère de celui de la section
   Règle d'or conservée : chaque bonne réponse DOIT exister parmi les options (erreur de build sinon).
---------------------------------------------------------------------------- */

/** même normalisation que le moteur (norm() de carnet-engine.js) */
export function norm(s: string): string {
  return (s || '').toLowerCase().replace(/[‘’ʼ′`]/g, "'").replace(/[.,;:!?…–—]/g, '').replace(/\s+/g, ' ').trim();
}

const item = z.object({
  text: z.string(),                         // « ___ » = place du menu déroulant (HTML autorisé)
  options: z.array(z.string()).optional(),  // sinon : le pool de la section
  answer: z.string().optional(),
  answers: z.array(z.string()).optional(),  // variantes acceptées (contractions…)
  theme: z.string().optional(),             // thème par item (sinon celui de la section)
});

const section = z.object({
  code: z.string(),                         // préfixe des ids (a1_…, b1_…) sauf id_prefix
  name: z.string(),                         // nom complet (GTEST1 sections[].name, labels « B1.3 »)
  heading: z.string().optional(),           // le <h3> visible (sinon name)
  icon: z.string().default('✏️'),
  color: z.enum(['c-pink', 'c-mint', 'c-sun', 'c-sky', 'c-grape']).default('c-pink'),
  theme: z.string().optional(),             // la notion travaillée (stats par thème)
  points: z.number().int().positive().optional(),
  block: z.boolean().default(false),        // chaque menu sur sa ligne (Match, Traduction)
  wide: z.boolean().default(false),         // menus larges
  instr: z.string().optional(),
  pool: z.array(z.string()).optional(),     // options communes à tous les items
  id_prefix: z.string().optional(),
  items: z.array(item).min(1),
}).superRefine((sec, ctx) => {
  sec.items.forEach((it, i) => {
    const options = sec.pool ?? it.options;
    const correct = it.answers ?? (it.answer !== undefined ? [it.answer] : []);
    if (!options || !options.length)
      ctx.addIssue({ code: 'custom', path: ['items', i], message: `${sec.name} item ${i + 1} : aucune option (ni pool, ni options)` });
    if (!correct.length)
      ctx.addIssue({ code: 'custom', path: ['items', i], message: `${sec.name} item ${i + 1} : ni answer ni answers` });
    if (options && correct.length) {
      const normed = new Set(options.map(norm));
      if (!correct.some((c) => normed.has(norm(c))))
        ctx.addIssue({ code: 'custom', path: ['items', i], message: `${sec.name} item ${i + 1} : la réponse ${JSON.stringify(correct)} n'est pas parmi les options ${JSON.stringify(options)}` });
    }
  });
});

const carnets = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/carnets' }),
  schema: z.object({
    classe: z.string().regex(/^[a-z]+$/),   // dossier URL (cprp, elec, ms, gtla, ndrc, aftral)
    slug: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string(),
    palette: z.enum(['green', 'violet', 'blue', 'amber']).default('green'),
    deco: z.array(z.string()).max(4).default(['⭐', '✨', '🌟', '💫']),
    hero_watermark: z.string().default('⭐'),
    hero_pill: z.string(),
    hero_h1: z.string(),                    // HTML autorisé (<br>)
    hero_tagline: z.string().default('Reading & Grammar'),
    level: z.string().default('B1'),
    class: z.string(),                      // étiquette de classe préremplie (« CPRP 1 »)
    test_name: z.string(),                  // ÉCRIT TEL QUEL dans le code GTEST1 (certains contiennent « &amp; » : conserver)
    ps_title: z.string(),
    ps_sub: z.string(),
    foot: z.string(),
    intro: z.string().optional(),           // consigne sous le hero (carnets sans histoire)
    story: z.array(z.string()).default([]), // paragraphes (HTML autorisé, <span class="hl">) — vide = pas de carte histoire
    sections: z.array(section).min(1),
    glossary: z.record(z.string(), z.object({ fr: z.string(), en: z.string() })).optional(),  // dico au tap hors-ligne (mots-clés)
  }),
});

export const collections = { carnets };
