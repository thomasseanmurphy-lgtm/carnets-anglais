#!/usr/bin/env python3
"""
import-specs.py — migre les fiches `_specs/*.json` (+ cas particuliers) vers la content
collection Astro `src/content/carnets/<classe>--<slug>.json`.

Pour chaque carnet moteur (19) :
  1. contenu (story, sections, deco, hero…) ← la fiche JSON
  2. champs de classe (title, hero_pill, class, test_name, ps_title, ps_sub, foot, palette)
     ← le HTML EN PROD (ce qui est en ligne fait foi, entités HTML décodées)
  3. contrôle : ANS / SECTIONS / THEME / test recalculés == ceux de la page en prod → sinon erreur.

Usage : python3 scripts/import-specs.py   (depuis la racine du dépôt, sur la branche refonte)
"""
import json, os, re, sys, html, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPECS = os.path.join(ROOT, "_specs")
SKILL = "/Users/thomasmurphy/Documents/COURS/.claude/skills/worksheet-b1"
OUT = os.path.join(ROOT, "src", "content", "carnets")
PALETTE_BY_GRAPE = {"2f9e6f": "green", "7c5cff": "violet", "2f74d0": "blue", "e0872a": "amber"}
SKIP = {"elec/transformer-failure"}   # workbook imprimable, hors moteur GTEST1


def norm(s):
    s = (s or "").lower()
    for ch in "‘’ʼ′`": s = s.replace(ch, "'")
    for ch in ".,;:!?…–—": s = s.replace(ch, "")
    return " ".join(s.split()).strip()


def live_path(classe, slug):
    return os.path.join(ROOT, classe, slug, "index.html")


def live_html(classe, slug):
    # la page en prod de référence : tests/golden/ (figée), sinon `main`, sinon le fichier local
    g = os.path.join(ROOT, "tests", "golden", f"{classe}--{slug}.html")
    if os.path.exists(g):
        with open(g, encoding="utf-8") as f:
            return f.read()
    import subprocess
    try:
        return subprocess.check_output(["git", "show", f"main:{classe}/{slug}/index.html"], cwd=ROOT).decode("utf-8")
    except subprocess.CalledProcessError:
        with open(live_path(classe, slug), encoding="utf-8") as f:
            return f.read()


def grab(pattern, text, default=""):
    m = re.search(pattern, text, re.S)
    return html.unescape(m.group(1)).strip() if m else default


def live_fields(h):
    return {
        "title": grab(r"<title>(.*?)</title>", h),
        "hero_pill": grab(r'class="pill">(.*?)<', h),
        "class": grab(r'id="stuClass" value="([^"]*)"', h),
        "test_name": grab(r'LAST=\{test:"([^"]*)"', h),
        "ps_title": grab(r"ps-title'>(.*?)<", h),
        "ps_sub": grab(r"ps-sub'>(.*?)<", h),
        "foot": grab(r'class="foot">(.*?)<', h),
        "palette": PALETTE_BY_GRAPE.get(grab(r"--grape:#([0-9a-f]{6})", h), "green"),
    }


def live_data(h):
    """Lit ANS / SECTIONS / THEME de la page en prod. Les carnets faits main utilisent des
    objets JS (clés non quotées) → on fait évaluer les 3 blocs par Node dans un bac à sable."""
    import subprocess
    blocks = "".join(re.search(r"(var %s\s*=\s*[\[{].*?[\]}]\s*;)" % k, h, re.S).group(1) + "\n" for k in ("ANS", "SECTIONS", "THEME"))
    js = "const vm=require('vm');const c={};vm.createContext(c);vm.runInContext(process.argv[1]+';',c);" \
         "process.stdout.write(JSON.stringify({ANS:c.ANS,SECTIONS:c.SECTIONS,THEME:c.THEME}))"
    d = json.loads(subprocess.check_output(["node", "-e", js, blocks]).decode("utf-8"))
    d["test"] = re.search(r'LAST=\{test:"([^"]*)"', h).group(1)   # tel quel, SANS décoder (entités comprises !)
    return d


def compute_data(spec):
    """Reproduit le générateur worksheet-b1 (ids, labels, ANS, SECTIONS, THEME)."""
    ans, sections, theme = {}, [], {}
    for sec in spec["sections"]:
        code, name = sec["code"], sec["name"]          # name = nom COMPLET (ex. « B1 Perfect/Past »)
        prefix = sec.get("id_prefix") or code.lower().replace("/", "").replace(" ", "")
        ids = []
        pool = sec.get("pool")
        for i, item in enumerate(sec["items"], 1):
            sid = f"{prefix}_{i}"
            options = pool if pool is not None else item["options"]
            correct = list(item["answers"]) if "answers" in item else [item["answer"]]
            if not any(norm(c) in {norm(o) for o in options} for c in correct):
                raise SystemExit(f"[ERREUR] {code} {name} item {i}: réponse {correct!r} absente des options")
            ids.append(sid); ans[sid] = correct; theme[sid] = item.get("theme") or sec.get("theme", name)
        sections.append({"name": name, "ids": ids})
    return {"ANS": ans, "SECTIONS": sections, "THEME": theme}


def reconcile(entry, live):
    """Aligne la fiche sur la prod : préfixe d'ids, thème par item, réponses acceptées.
    La fiche est une mémoire régénérable ; ce qui est en ligne fait foi."""
    notes = []
    if len(entry["sections"]) != len(live["SECTIONS"]):
        raise SystemExit(f"[ERREUR] {entry['classe']}/{entry['slug']}: {len(entry['sections'])} sections dans la fiche, {len(live['SECTIONS'])} en prod")
    for sec, ls in zip(entry["sections"], live["SECTIONS"]):
        full = f"{sec['code']} {sec['name']}"
        if full != ls["name"]:
            notes.append(f"section « {full} » nommée « {ls['name']} » en prod → conservé"); full = ls["name"]
        sec["name"] = full          # le modèle Astro stocke le nom complet (= prod)
        if len(sec["items"]) != len(ls["ids"]):
            raise SystemExit(f"[ERREUR] section « {full} »: {len(sec['items'])} items vs {len(ls['ids'])} en prod")
        default_prefix = sec["code"].lower().replace("/", "").replace(" ", "")
        live_prefix = ls["ids"][0].rsplit("_", 1)[0]
        if live_prefix != default_prefix:
            sec["id_prefix"] = live_prefix; notes.append(f"« {full} » ids « {live_prefix}_n »")
        sec_theme = sec.get("theme", sec["name"])
        for i, (item, lid) in enumerate(zip(sec["items"], ls["ids"]), 1):
            if lid != f"{live_prefix}_{i}":
                raise SystemExit(f"[ERREUR] « {full} » item {i}: id prod « {lid} » non séquentiel")
            lt = live["THEME"].get(lid)
            if lt and lt != sec_theme:
                item["theme"] = lt
            la = live["ANS"].get(lid)
            mine = list(item["answers"]) if "answers" in item else [item["answer"]]
            if la is not None and la != mine:
                item.pop("answer", None); item.pop("answers", None)
                if len(la) == 1: item["answer"] = la[0]
                else: item["answers"] = la
                notes.append(f"« {full} » item {i}: réponses {mine!r} → prod {la!r}")
        themes = {it.get("theme") for it in sec["items"] if it.get("theme")}
        if themes: notes.append(f"« {full} » thèmes par item : {sorted(themes)}")
    return notes


def main():
    specs = {}
    for p in glob.glob(os.path.join(SPECS, "*.json")):
        s = json.load(open(p, encoding="utf-8"))
        if s.get("output"):
            m = re.search(r"/([a-z]+)/([a-z0-9-]+)/index\.html$", s["output"])
            if m: specs[f"{m.group(1)}/{m.group(2)}"] = s
        elif "grafcet" in p:
            specs["elec/automation-grafcet"] = s
    specs["cprp/delivery-qc"] = json.load(open(os.path.join(SKILL, "examples", "cprp1_delivery_qc.json"), encoding="utf-8"))

    carnets = sorted(d for d in (os.path.relpath(p, ROOT).rsplit("/", 1)[0] for p in glob.glob(os.path.join(ROOT, "*", "*", "index.html")))
                     if d not in SKIP and not d.startswith("_"))
    # sur la branche de refonte, les pages ont pu être supprimées : on part de la liste des fiches
    if not carnets:
        carnets = sorted(specs)
    ok = 0
    os.makedirs(OUT, exist_ok=True)
    for cs in carnets:
        classe, slug = cs.split("/")
        spec = specs.get(cs)
        if not spec:
            print(f"⚠️  {cs}: pas de fiche — ignoré"); continue
        h = live_html(classe, slug)
        lf = live_fields(h)
        entry = {
            "classe": classe, "slug": slug,
            "title": lf["title"], "palette": lf["palette"],
            "deco": spec.get("deco", ["⭐", "✨", "🌟", "💫"]),
            "hero_watermark": spec.get("hero_watermark", "⭐"),
            "hero_pill": lf["hero_pill"], "hero_h1": spec["hero_h1"],
            "hero_tagline": spec.get("hero_tagline", "Reading & Grammar"),
            "level": spec.get("level", "B1"), "class": lf["class"],
            # test_name = la chaîne EXACTE qui part dans le code GTEST1 (les stats serveur agrègent dessus).
            # En prod certains carnets générés contiennent « &amp; », les faits main « & » : on conserve tel quel.
            "test_name": re.search(r'LAST=\{test:"([^"]*)"', h).group(1),
            "ps_title": lf["ps_title"], "ps_sub": lf["ps_sub"], "foot": lf["foot"],
            "story": spec["story"], "sections": spec["sections"],
        }
        # --- réconciliation avec la prod (ids personnalisés, thème par item, réponses) ---
        want = live_data(h)
        notes = reconcile(entry, want)
        for n in notes: print(f"   ↳ {cs}: {n}")
        # --- contrôle d'identité des données GTEST1 ---
        got = compute_data(entry)
        got["test"] = entry["test_name"]
        diffs = [k for k in ("ANS", "SECTIONS", "THEME", "test") if want[k] != got[k]]
        if diffs:
            print(f"❌ {cs}: données différentes de la prod → {diffs}")
            for k in diffs:
                if k == "test": print("   prod:", want[k], "\n   calc:", got[k]); continue
                for kk in set(list(want[k]) if isinstance(want[k], dict) else range(len(want[k]))):
                    a = want[k].get(kk) if isinstance(want[k], dict) else want[k][kk]
                    b = got[k].get(kk) if isinstance(got[k], dict) else (got[k][kk] if kk < len(got[k]) else None)
                    if a != b: print(f"   {k}[{kk}] prod={a!r} calc={b!r}")
            sys.exit(1)
        # champs éditoriaux ajoutés à la main dans la collection (hors fiche d'origine) : on les conserve
        dest = os.path.join(OUT, f"{classe}--{slug}.json")
        if os.path.exists(dest):
            try:
                prev = json.load(open(dest, encoding="utf-8"))
                for k in ("intro", "glossary"):
                    if k in prev and k not in entry: entry[k] = prev[k]
            except Exception: pass
        with open(dest, "w", encoding="utf-8") as f:
            json.dump(entry, f, ensure_ascii=False, indent=2); f.write("\n")
        ok += 1
        print(f"✅ {cs:34s} {len(entry['sections'])} sections · {len(got['ANS'])} items · {lf['palette']:6s} · test=« {entry['test_name']} »")
    print(f"\n{ok} carnets importés dans {os.path.relpath(OUT, ROOT)}/")


if __name__ == "__main__":
    main()
