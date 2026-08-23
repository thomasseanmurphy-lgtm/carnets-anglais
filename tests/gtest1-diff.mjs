/* GATE GTEST1 — la refonte doit produire EXACTEMENT le même code que la prod.
   Pour chaque carnet : page prod (branche main) vs page Astro (dist/), mêmes réponses, même séquence
   (valider chaque section → Check my answers) → codes GTEST1 décodés identiques (hors date/submitted).
   Usage : npm run build && npm test   (option : node tests/gtest1-diff.mjs cprp/recycling-drive) */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { JSDOM, VirtualConsole } from 'jsdom';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const only = process.argv[2];
const carnets = readdirSync(`${ROOT}src/content/carnets`).filter((f) => f.endsWith('.json'))
  .map((f) => { const d = JSON.parse(readFileSync(`${ROOT}src/content/carnets/${f}`, 'utf8')); return [d.classe, d.slug]; })
  .filter(([c, s]) => !only || `${c}/${s}` === only);

const norm = (s) => (s || '').toLowerCase().replace(/[‘’ʼ′`]/g, "'").replace(/[.,;:!?…–—]/g, '').replace(/\s+/g, ' ').trim();

/* la page PROD de référence : figée dans tests/golden/ (copie de main au 23/08/2026, avant la bascule) */
function prodHtml(classe, slug) {
  const golden = `${ROOT}tests/golden/${classe}--${slug}.html`;
  if (existsSync(golden)) return readFileSync(golden, 'utf8');
  return execSync(`git show main:${classe}/${slug}/index.html`, { cwd: ROOT, maxBuffer: 1 << 24 }).toString();
}
function prodData(html) {
  const ctx = {};
  vm.createContext(ctx);
  for (const k of ['ANS', 'SECTIONS', 'THEME']) vm.runInContext(html.match(new RegExp(`(var ${k}\\s*=\\s*[\\[{][\\s\\S]*?[\\]}]\\s*;)`))[1], ctx);
  return { ans: ctx.ANS, sections: ctx.SECTIONS, theme: ctx.THEME, test: html.match(/LAST=\{test:"([^"]*)"/)[1] };
}
function newData(html) {
  const m = html.match(/window\.CARNET=(\{[\s\S]*?\});<\/script>/);
  return JSON.parse(m[1]);
}

/* page → DOM exécutable : on retire fonts/CSS/platform/ui, on inline le moteur */
function dom(html, { engine } = {}) {
  html = html.replace(/<link[^>]+>/g, '').replace(/<script[^>]+platform\.js[^>]*><\/script>/g, '').replace(/<script[^>]+carnet-ui\.js[^>]*><\/script>/g, '');
  if (engine) html = html.replace(/<script[^>]+carnet-engine\.js[^>]*><\/script>/, `<script>${engine}</script>`);
  const vc = new VirtualConsole(); vc.on('jsdomError', (e) => { if (!/Could not parse CSS|canvas/.test(e.message)) console.error('  [jsdom]', e.message.split('\n')[0]); });
  const d = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc });
  d.window.HTMLElement.prototype.scrollIntoView = () => {}; d.window.scrollTo = () => {};
  d.window.alert = () => {}; d.window.confirm = () => true;   // (le carnet B2 fait main confirme avant d'enregistrer)
  return d;
}

/* motifs de réponses : fonction (index global de l'item) → 'ok' | 'wrong' | 'blank' | 'empty' */
const PATTERNS = {
  'tout juste': () => 'ok',
  'tout faux': () => 'wrong',
  'mixte 2/3': (k) => (k % 3 === 2 ? 'wrong' : 'ok'),
  'avec blancs': (k) => (k % 5 === 0 ? 'blank' : k % 7 === 3 ? 'wrong' : 'ok'),
};

function play(d, data, pattern, name) {
  const w = d.window, doc = w.document;
  doc.getElementById('stuName').value = name;
  let k = 0;
  for (const sec of data.sections) {
    for (const id of sec.ids) {
      const el = doc.getElementById(id); if (!el) throw new Error(`select #${id} introuvable`);
      const correct = data.ans[id].map(norm);
      const opts = [...el.options].map((o) => o.value).filter((v) => v && v !== '__blank__').sort();   // ordre stable (le moteur mélange l'ordre DOM)
      const kind = pattern(k++);
      let v = '';
      if (kind === 'ok') v = opts.find((o) => correct.includes(norm(o)));
      else if (kind === 'wrong') v = opts.find((o) => !correct.includes(norm(o))) ?? '__blank__';
      else if (kind === 'blank') v = '__blank__';
      if (v === undefined) throw new Error(`${id}: pas d'option pour « ${kind} » parmi ${JSON.stringify(opts)}`);
      el.value = v; el.dispatchEvent(new w.Event('change', { bubbles: true }));
    }
    doc.querySelector(`[data-act="validate"][data-sec="${sec.name.replace(/"/g, '\\"')}"]`).click();
  }
  const submit = [...doc.querySelectorAll('[data-act="submit"]')].find((b) => b.style.display !== 'none');
  if (!submit) throw new Error('bouton « Check my answers » toujours caché après validation de toutes les sections');
  submit.click();
  const code = doc.getElementById('exportCode').value;
  if (!code.startsWith('GTEST1::')) throw new Error(`pas de code : « ${code} »`);
  const obj = JSON.parse(Buffer.from(code.slice(8), 'base64').toString('utf8'));
  delete obj.date; delete obj.submitted;
  return obj;
}

const engine = readFileSync(`${ROOT}public/assets/carnet-engine.js`, 'utf8');
let fail = 0, runs = 0;
for (const [classe, slug] of carnets) {
  const distPath = `${ROOT}dist/${classe}/${slug}/index.html`;
  if (!existsSync(distPath)) { console.log(`❌ ${classe}/${slug}: pas de page dans dist/ (npm run build ?)`); fail++; continue; }
  const pHtml = prodHtml(classe, slug), nHtml = readFileSync(distPath, 'utf8');
  const pd = prodData(pHtml), nd = newData(nHtml);
  const staticDiff = ['test', 'ans', 'sections', 'theme'].filter((key) => JSON.stringify(pd[key]) !== JSON.stringify(nd[key]));
  if (staticDiff.length) { console.log(`❌ ${classe}/${slug}: données statiques différentes → ${staticDiff.join(', ')}`); fail++; continue; }
  const results = [];
  for (const [label, pattern] of Object.entries(PATTERNS)) {
    try {
      const a = play(dom(pHtml), pd, pattern, 'Test Élève');
      const b = play(dom(nHtml, { engine }), nd, pattern, 'Test Élève');
      runs++;
      const sa = JSON.stringify(a), sb = JSON.stringify(b);
      if (sa === sb) results.push(`${label} ${a.out20}/20 ✓`);
      else {
        fail++; results.push(`${label} ✗`);
        const ka = Object.keys(a).filter((x) => JSON.stringify(a[x]) !== JSON.stringify(b[x]));
        console.log(`   ✗ ${label}: champs différents → ${ka.join(', ')}`);
        for (const x of ka) { console.log('     prod:', JSON.stringify(a[x]).slice(0, 300)); console.log('     new :', JSON.stringify(b[x]).slice(0, 300)); }
      }
    } catch (e) { fail++; results.push(`${label} 💥 ${e.message}`); }
  }
  console.log(`${results.every((r) => r.includes('✓')) ? '✅' : '❌'} ${(classe + '/' + slug).padEnd(32)} ${results.join(' · ')}`);
}
console.log(`\n${carnets.length} carnets · ${runs} comparaisons · ${fail ? fail + ' ÉCHEC(S)' : 'tous identiques'} — GTEST1 ${fail ? 'DIFFÉRENT ❌' : 'IDENTIQUE ✅'}`);
process.exit(fail ? 1 : 0);
