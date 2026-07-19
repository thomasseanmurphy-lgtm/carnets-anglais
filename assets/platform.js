/* Carnets d'anglais — branchement plateforme.
   Ajouté à chaque carnet : quand l'élève a validé (code GTEST1 prêt),
   les résultats sont enregistrés AUTOMATIQUEMENT (POST vers l'API, sans bouton),
   puis un lien vers sa page perso « Ma progression » (cumulée sur tous les carnets)
   s'affiche. Additif : ne touche pas au carnet. */
(function () {
  var API = "https://carnets-api.thomas-sean-murphy.workers.dev";

  // classId + slug depuis l'URL : .../<classId>/<slug>/[index.html]
  var segs = location.pathname.split("/").filter(function (s) { return s && s.toLowerCase() !== "index.html"; });
  var slug = segs.length ? segs[segs.length - 1] : "";
  var classId = segs.length > 1 ? segs[segs.length - 2] : "";

  // ---- Menu déroulant des noms (si un roster existe pour la classe) ----
  function setupRoster() {
    var input = document.getElementById("stuName");
    if (!input || !classId) return;
    fetch(API + "/api/roster?class=" + encodeURIComponent(classId))
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var names = (d && d.names) || [];
        if (!names.length) return; // pas de roster -> on garde le champ libre
        var sel = document.createElement("select");
        sel.id = "stuNameSelect";
        sel.style.cssText = input.style.cssText;
        sel.style.minWidth = "220px";
        sel.innerHTML = '<option value="">— Choisis ton nom —</option>' +
          names.map(function (n) { return '<option>' + n.replace(/</g, "&lt;") + '</option>'; }).join("") +
          '<option value="__other__">— Autre / absent de la liste —</option>';
        input.parentNode.insertBefore(sel, input);
        input.style.display = "none"; // caché par défaut, on force le choix dans la liste
        sel.addEventListener("change", function () {
          if (sel.value === "__other__") {
            input.style.display = "";
            input.value = "";
            input.focus();
          } else {
            input.style.display = "none";
            input.value = sel.value;
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.dispatchEvent(new Event("change", { bubbles: true }));
          }
        });
      })
      .catch(function () {});
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setupRoster);
  else setupRoster();

  // ---- Suivi des connexions : signale au serveur qui a ouvert le carnet ----
  // Envoyé au plus 1 fois par jour, par carnet et par élève (le nom vient du champ,
  // du menu déroulant, ou de la restauration automatique d'une visite précédente).
  function pingVisit() {
    var el = document.getElementById("stuName");
    var name = el ? (el.value || "").trim() : "";
    if (!name || !classId || !slug) return;
    var day = new Date().toISOString().slice(0, 10);
    var vKey = "carnet_visit_" + classId + "_" + slug + "_" + day + "_" + name.toLowerCase();
    try { if (localStorage.getItem(vKey)) return; } catch (e) {}
    fetch(API + "/api/visit", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classId: classId, slug: slug, name: name })
    }).then(function (r) {
      if (r && r.ok) { try { localStorage.setItem(vKey, "1"); } catch (e) {} }
    }).catch(function () {});
  }
  document.addEventListener("change", function (e) {
    if (e.target && e.target.id === "stuName") setTimeout(pingVisit, 200);
  }, true);
  function initVisit() { setTimeout(pingVisit, 1500); } // après restauration du nom
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initVisit);
  else initVisit();

  // ---- Sauvegarde locale : ne rien perdre même si l'élève quitte un carnet inachevé ----
  (function persistence() {
    var stateKey = "carnet_state_" + classId + "_" + slug;
    var st;
    try { st = JSON.parse(localStorage.getItem(stateKey)) || {}; } catch (e) { st = {}; }
    if (!st.v) st.v = {}; if (!st.sections) st.sections = [];
    function isAnswer(el) {
      if (!el.id) return false;
      var t = (el.type || "").toLowerCase();
      return !(t === "button" || t === "submit" || t === "reset" || t === "file");
    }
    function saveNow() {
      var v = {};
      var list = document.querySelectorAll("input[id], select[id], textarea[id]");
      for (var i = 0; i < list.length; i++) {
        var el = list[i]; if (!isAnswer(el)) continue;
        v[el.id] = (el.type === "checkbox" || el.type === "radio") ? (el.checked ? "1" : "") : el.value;
      }
      st.v = v;
      try { localStorage.setItem(stateKey, JSON.stringify(st)); localStorage.setItem(startedKey, "1"); } catch (e) {}
    }
    var timer;
    function saveSoon() { clearTimeout(timer); timer = setTimeout(saveNow, 400); }
    function cssEsc(s) { return (window.CSS && CSS.escape) ? CSS.escape(s) : String(s).replace(/"/g, '\\"'); }
    function restore() {
      var ids = Object.keys(st.v || {});
      for (var i = 0; i < ids.length; i++) {
        var el = document.getElementById(ids[i]); if (!el) continue;
        if (el.type === "checkbox" || el.type === "radio") el.checked = st.v[ids[i]] === "1";
        else el.value = st.v[ids[i]];
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }
      // re-valide les sections déjà validées (reproduit l'état vert/verrouillé)
      (st.sections || []).forEach(function (sec) {
        var btn = document.querySelector('[data-act="validate"][data-sec="' + cssEsc(sec) + '"]');
        if (btn) { try { btn.click(); } catch (e) {} }
      });
    }
    document.addEventListener("input", saveSoon, true);
    document.addEventListener("change", saveSoon, true);
    document.addEventListener("click", function (e) {
      var el = e.target;
      var vb = el && el.closest ? el.closest('[data-act="validate"]') : null;
      if (vb && vb.getAttribute("data-sec")) {
        var sec = vb.getAttribute("data-sec");
        if (st.sections.indexOf(sec) < 0) st.sections.push(sec);
        setTimeout(saveNow, 60);
      }
      var rb = el && el.closest ? el.closest('[data-act="reset"]') : null;
      if (rb) { try { localStorage.removeItem(stateKey); } catch (e) {} st = { v: {}, sections: [] }; }
    }, true);
    function go() { setTimeout(restore, 400); }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go); else go();
  })();

  function getCode() {
    var el = document.getElementById("exportCode");
    var v = el ? (el.value || el.textContent || "") : "";
    return v.indexOf("GTEST1::") === 0 ? v.trim() : "";
  }
  var storeKey = "carnet_me_" + classId + "_" + slug;
  var startedKey = "carnet_started_" + classId + "_" + slug;
  var doneKey = "carnet_done_" + classId + "_" + slug;

  // Masquer les anciens boutons devenus inutiles (envoi par e-mail + copier le code) — remplacés par la plateforme
  (function hideOldButtons() {
    var css = document.createElement("style");
    css.textContent = '#mailBtn,[onclick*="emailResult"],[data-act="copy"],#copyBtn{display:none !important;}';
    (document.head || document.documentElement).appendChild(css);
  })();

  // ---- Barre fixe du bas (« Valide chaque section · — / 20 · Reset ») ----
  // Cachée pendant les exercices ; révélée seulement quand le carnet est fini.
  // Signal UNIVERSEL (ancien + nouveau carnet, avec ou sans "gate" par section) :
  // toutes les réponses (menus déroulants des cartes) sont remplies.
  (function gateStickyBar() {
    var css = document.createElement("style");
    css.textContent = 'body:not(.sections-done) .bar{display:none !important;}';
    (document.head || document.documentElement).appendChild(css);
    function readyToShow() {
      var sels = document.querySelectorAll(".card select");
      if (!sels.length) return true; // carnet sans dropdowns -> pas de gating, barre visible
      for (var i = 0; i < sels.length; i++) {
        if ((sels[i].value || "") === "") return false; // il reste une réponse vide
      }
      return true;
    }
    function sync() {
      if (document.body) document.body.classList.toggle("sections-done", readyToShow());
    }
    setInterval(sync, 400);
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", sync);
    else sync();
  })();

  // Panneau flottant : enregistrement AUTOMATIQUE (plus de bouton « Envoyer »).
  // L'élève ne voit que l'état + le lien vers sa progression cumulée sur tous les carnets.
  var bar = document.createElement("div");
  bar.id = "platformBar";
  bar.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:99999;display:none;justify-content:center;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 16px;background:rgba(255,255,255,.96);box-shadow:0 -6px 24px rgba(40,90,70,.16);font-family:system-ui,-apple-system,sans-serif;";
  bar.innerHTML =
    '<span id="pfMsg" style="display:inline-flex;align-items:center;color:#5f6a75;font-size:14px;font-weight:600;"></span>' +
    '<a id="pfMe" href="#" target="_blank" rel="noopener" style="display:none;align-items:center;background:#127a55;color:#fff;border-radius:12px;padding:12px 20px;font-size:15px;font-weight:700;text-decoration:none;">📊 Voir ma progression →</a>' +
    '<button id="pfRetry" style="display:none;background:#e0a43b;color:#fff;border:none;border-radius:12px;padding:11px 18px;font-size:14px;font-weight:700;cursor:pointer;">🔄 Réessayer</button>';
  function mount() { if (!document.getElementById("platformBar")) document.body.appendChild(bar); }
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);

  var meLink = bar.querySelector("#pfMe"), retryBtn = bar.querySelector("#pfRetry"), msg = bar.querySelector("#pfMsg");
  function flash(text, warn) { msg.textContent = text; msg.style.color = warn ? "#c8871f" : "#2e9e6e"; msg.style.display = "inline-flex"; }
  function showMe(url) { meLink.href = url; meLink.style.display = "inline-flex"; }

  var saved = null; try { saved = localStorage.getItem(storeKey); } catch (e) {}
  if (saved) { showMe(saved); flash("✅ Ta progression est enregistrée."); bar.style.display = "flex"; }

  // Ne pas ré-envoyer un code déjà enregistré (évite de recompter un essai à la ré-ouverture d'un carnet fini).
  var sentKey = "carnet_sentcode_" + classId + "_" + slug;
  var sentCode = ""; try { sentCode = localStorage.getItem(sentKey) || ""; } catch (e) {}
  var lastTried = "", pending = false;

  function autoSend(code) {
    if (pending) return;
    pending = true; lastTried = code; retryBtn.style.display = "none";
    flash("⏳ Enregistrement de tes résultats…");
    fetch(API + "/api/submit", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classId: classId, slug: slug, code: code })
    }).then(function (r) { return r.json(); }).then(function (d) {
      pending = false;
      if (d && d.ok) {
        sentCode = code;
        try { localStorage.setItem(sentKey, code); localStorage.setItem(storeKey, d.meUrl); localStorage.setItem(doneKey, "1"); } catch (e) {}
        showMe(d.meUrl);
        flash("✅ Progression enregistrée (" + String(d.out20).replace(".", ",") + "/20).");
      } else if (d && d.error === "no_name") {
        // le code sans nom reste "lastTried" : pas de boucle ; on re-tentera si l'élève choisit son nom et re-valide
        flash("Choisis ton nom en haut du carnet, puis re-valide-le.", true);
      } else {
        flash("Enregistrement impossible pour l'instant.", true); retryBtn.style.display = "inline-flex";
      }
    }).catch(function () {
      pending = false;
      flash("Pas de connexion — tes résultats ne sont pas encore enregistrés.", true);
      retryBtn.style.display = "inline-flex";
    });
  }

  retryBtn.addEventListener("click", function () {
    var code = getCode();
    if (!code) { flash("Termine d'abord le carnet (ta note doit s'afficher).", true); return; }
    lastTried = ""; autoSend(code);
  });

  // Dès qu'un code valide apparaît (carnet validé), afficher la barre et enregistrer tout seul.
  setInterval(function () {
    var code = getCode();
    if (code && bar.style.display === "none") bar.style.display = "flex";
    if (code && code !== sentCode && code !== lastTried && !pending) autoSend(code);
  }, 1000);
})();

/* ---------------------------------------------------------------------------
   Sons d'interface — palette « Cuelume » (Daniel Belyi, MIT), portée en JS
   vanilla. Aucun fichier audio, aucune dépendance : les 14 sons sont
   synthétisés en direct par la Web Audio API. S'ajoute à TOUS les carnets
   d'un coup (via platform.js), sans toucher au HTML généré.
   Bouton mute flottant (haut-droite) + préférence mémorisée par navigateur.
--------------------------------------------------------------------------- */
(function sound() {
  // ---- Recettes des 14 sons (copie fidèle de cuelume/src/sounds/recipes.ts) ----
  var RECIPES = {
    chime: { masterGain: 0.5, layers: [
      { kind: "tone", waveform: "sine", frequency: 1046.5, attack: 0.006, decay: 0.22, peak: 0.09 },
      { kind: "tone", waveform: "sine", frequency: 1568, offset: 0.09, attack: 0.006, decay: 0.26, peak: 0.08 }],
      shimmer: { delay: 0.12, feedback: 0.25, wet: 0.18, lowpass: 4000 } },
    sparkle: { masterGain: 0.5, layers: [
      { kind: "tone", waveform: "sine", frequency: 1760, offset: 0, attack: 0.003, decay: 0.09, peak: 0.045 },
      { kind: "tone", waveform: "sine", frequency: 2217, offset: 0.045, attack: 0.003, decay: 0.09, peak: 0.04 },
      { kind: "tone", waveform: "sine", frequency: 2637, offset: 0.09, attack: 0.003, decay: 0.1, peak: 0.038 },
      { kind: "tone", waveform: "sine", frequency: 3520, offset: 0.135, attack: 0.003, decay: 0.12, peak: 0.032 }],
      shimmer: { delay: 0.07, feedback: 0.35, wet: 0.22, lowpass: 6000 } },
    droplet: { masterGain: 0.55, layers: [
      { kind: "tone", waveform: "sine", frequency: 1200, glideTo: 550, glideTime: 0.14, attack: 0.004, decay: 0.2, peak: 0.075 }],
      shimmer: { delay: 0.09, feedback: 0.2, wet: 0.15, lowpass: 3000 } },
    bloom: { masterGain: 0.5, layers: [
      { kind: "tone", waveform: "sine", frequency: 528, attack: 0.06, decay: 0.32, peak: 0.06 },
      { kind: "tone", waveform: "sine", frequency: 528, detune: 12, attack: 0.06, decay: 0.34, peak: 0.05 }],
      shimmer: { delay: 0.15, feedback: 0.2, wet: 0.12, lowpass: 2500 } },
    whisper: { masterGain: 0.5, layers: [
      { kind: "noise", filterType: "lowpass", filterFrequency: 1200, filterQ: 0.7, attack: 0.04, decay: 0.16, peak: 0.05 }] },
    tick: { masterGain: 0.4, layers: [
      { kind: "noise", filterType: "bandpass", filterFrequency: 5400, filterQ: 1.8, attack: 0.001, decay: 0.018, peak: 0.14 },
      { kind: "tone", waveform: "sine", frequency: 2600, attack: 0.001, decay: 0.012, peak: 0.018 }] },
    press: { masterGain: 0.4, layers: [
      { kind: "noise", filterType: "bandpass", filterFrequency: 1700, filterQ: 1.4, attack: 0.001, decay: 0.02, peak: 0.13 }] },
    release: { masterGain: 0.4, layers: [
      { kind: "noise", filterType: "bandpass", filterFrequency: 4600, filterQ: 1.8, attack: 0.001, decay: 0.016, peak: 0.12 },
      { kind: "tone", waveform: "sine", frequency: 3200, offset: 0.006, attack: 0.001, decay: 0.05, peak: 0.02 }] },
    toggle: { masterGain: 0.4, layers: [
      { kind: "noise", filterType: "bandpass", filterFrequency: 2200, filterQ: 1.6, attack: 0.001, decay: 0.016, peak: 0.12 },
      { kind: "noise", filterType: "bandpass", filterFrequency: 3800, filterQ: 1.6, offset: 0.024, attack: 0.001, decay: 0.02, peak: 0.1 }] },
    success: { masterGain: 0.5, layers: [
      { kind: "tone", waveform: "sine", frequency: 880, attack: 0.004, decay: 0.09, peak: 0.06 },
      { kind: "tone", waveform: "sine", frequency: 1108.73, offset: 0.06, attack: 0.004, decay: 0.1, peak: 0.06 },
      { kind: "tone", waveform: "sine", frequency: 1318.51, offset: 0.12, attack: 0.004, decay: 0.18, peak: 0.07 }],
      shimmer: { delay: 0.1, feedback: 0.22, wet: 0.16, lowpass: 4500 } },
    error: { masterGain: 0.42, layers: [
      { kind: "noise", filterType: "bandpass", filterFrequency: 850, filterQ: 1.1, attack: 0.001, decay: 0.035, peak: 0.13 },
      { kind: "tone", waveform: "triangle", frequency: 440, offset: 0.025, attack: 0.004, decay: 0.09, peak: 0.045 },
      { kind: "tone", waveform: "triangle", frequency: 349.23, offset: 0.1, attack: 0.004, decay: 0.14, peak: 0.04 }] },
    page: { masterGain: 0.38, layers: [
      { kind: "noise", filterType: "lowpass", filterFrequency: 1800, filterQ: 0.7, attack: 0.006, decay: 0.08, peak: 0.11 },
      { kind: "noise", filterType: "bandpass", filterFrequency: 4200, filterQ: 1.2, offset: 0.04, attack: 0.004, decay: 0.065, peak: 0.08 },
      { kind: "tone", waveform: "sine", frequency: 2400, offset: 0.075, attack: 0.002, decay: 0.045, peak: 0.02 }] },
    loading: { masterGain: 0.42, layers: [
      { kind: "noise", filterType: "lowpass", filterFrequency: 1400, filterQ: 0.6, attack: 0.035, decay: 0.14, peak: 0.035 },
      { kind: "tone", waveform: "sine", frequency: 420, glideTo: 630, glideTime: 0.18, attack: 0.025, decay: 0.18, peak: 0.05 }],
      shimmer: { delay: 0.11, feedback: 0.18, wet: 0.12, lowpass: 2800 } },
    ready: { masterGain: 0.45, layers: [
      { kind: "noise", filterType: "bandpass", filterFrequency: 3200, filterQ: 1.7, attack: 0.001, decay: 0.018, peak: 0.1 },
      { kind: "tone", waveform: "sine", frequency: 659.25, offset: 0.025, attack: 0.012, decay: 0.2, peak: 0.05 },
      { kind: "tone", waveform: "sine", frequency: 987.77, offset: 0.025, attack: 0.012, decay: 0.22, peak: 0.035 }],
      shimmer: { delay: 0.13, feedback: 0.2, wet: 0.13, lowpass: 3600 } }
  };

  // ---- Moteur Web Audio (port de cuelume/src/audio/engine.ts) ----
  var STOP_PAD = 0.05, CLEANUP_MARGIN = 0.05, INAUDIBLE = 0.001;
  var ctx = null, enabled = true;

  function renderTone(c, dest, l, t0) {
    var osc = c.createOscillator();
    osc.type = l.waveform;
    osc.frequency.setValueAtTime(l.frequency, t0);
    if (l.detune) osc.detune.value = l.detune;
    if (l.glideTo !== undefined) {
      var g = l.glideTime != null ? l.glideTime : l.attack + l.decay;
      osc.frequency.exponentialRampToValueAtTime(l.glideTo, t0 + g);
    }
    var gain = c.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(l.peak, t0 + l.attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + l.attack + l.decay);
    osc.connect(gain).connect(dest);
    osc.start(t0);
    osc.stop(t0 + l.attack + l.decay + STOP_PAD);
  }

  function renderNoise(c, dest, l, t0) {
    var dur = l.attack + l.decay + STOP_PAD;
    var len = Math.max(1, Math.floor(dur * c.sampleRate));
    var buf = c.createBuffer(1, len, c.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = 2 * Math.random() - 1;
    var src = c.createBufferSource();
    src.buffer = buf;
    var filt = c.createBiquadFilter();
    filt.type = l.filterType;
    filt.frequency.value = l.filterFrequency;
    if (l.filterQ !== undefined) filt.Q.value = l.filterQ;
    var gain = c.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(l.peak, t0 + l.attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + l.attack + l.decay);
    src.connect(filt).connect(gain).connect(dest);
    src.start(t0);
    src.stop(t0 + dur);
  }

  function attachShimmer(c, source, dest, s) {
    var delay = c.createDelay(1); delay.delayTime.value = s.delay;
    var fbFilter = c.createBiquadFilter(); fbFilter.type = "lowpass"; fbFilter.frequency.value = s.lowpass;
    var fbGain = c.createGain(); fbGain.gain.value = s.feedback;
    var wet = c.createGain(); wet.gain.value = s.wet;
    source.connect(delay); delay.connect(fbFilter); fbFilter.connect(fbGain);
    fbGain.connect(delay); fbFilter.connect(wet); wet.connect(dest);
    return [delay, fbFilter, fbGain, wet];
  }

  function sourceEnd(r) {
    return Math.max.apply(null, r.layers.map(function (l) {
      return (l.offset || 0) + l.attack + l.decay + STOP_PAD;
    }));
  }
  function shimmerTail(s) {
    if (!s || s.feedback <= 0) return 0;
    if (s.feedback >= 1) return s.delay;
    return s.delay * (1 + Math.ceil(Math.log(INAUDIBLE) / Math.log(s.feedback)));
  }

  function renderRecipe(c, r) {
    var now = c.currentTime;
    var master = c.createGain(); master.gain.value = r.masterGain; master.connect(c.destination);
    var shimmerNodes = r.shimmer ? attachShimmer(c, master, c.destination, r.shimmer) : [];
    for (var i = 0; i < r.layers.length; i++) {
      var l = r.layers[i], t0 = now + (l.offset || 0);
      if (l.kind === "tone") renderTone(c, master, l, t0); else renderNoise(c, master, l, t0);
    }
    var cleanupMs = (sourceEnd(r) + shimmerTail(r.shimmer) + CLEANUP_MARGIN) * 1000;
    setTimeout(function () {
      master.disconnect();
      for (var j = 0; j < shimmerNodes.length; j++) shimmerNodes[j].disconnect();
    }, cleanupMs);
  }

  function getCtx() {
    if (ctx) return ctx;
    var Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    try { ctx = new Ctor(); } catch (e) { return null; }
    return ctx;
  }

  function play(name) {
    name = name || "chime";
    if (!enabled || !RECIPES.hasOwnProperty(name)) return;
    // Avant tout geste de l'élève, on ne force pas la reprise (politique autoplay).
    if (navigator.userActivation && navigator.userActivation.hasBeenActive === false) return;
    var c = getCtx(); if (!c) return;
    var r = RECIPES[name];
    if (c.state === "running") { renderRecipe(c, r); return; }
    try {
      c.resume().then(function () {
        if (enabled && c.state === "running") renderRecipe(c, r);
      }, function () {});
    } catch (e) {}
  }
  function setEnabled(v) { if (typeof v === "boolean") enabled = v; }

  // API interne (permet à un carnet de jouer un son précis plus tard, ex. bonne/mauvaise réponse)
  window.CarnetSound = { play: play, setEnabled: setEnabled, sounds: Object.keys(RECIPES) };

  // ---- Préférence mute (par navigateur) ----
  var MUTE_KEY = "carnet_sound_off";
  var muted = false;
  try { muted = localStorage.getItem(MUTE_KEY) === "1"; } catch (e) {}
  setEnabled(!muted);

  // ---- Bouton mute flottant (haut-droite : évite les deux barres du bas) ----
  function mountToggle() {
    if (document.getElementById("soundToggle")) return;
    var btn = document.createElement("button");
    btn.id = "soundToggle"; btn.type = "button";
    btn.setAttribute("aria-label", "Activer ou couper les sons");
    btn.style.cssText = "position:fixed;top:12px;right:12px;z-index:100000;width:42px;height:42px;" +
      "border:none;border-radius:50%;background:rgba(255,255,255,.92);backdrop-filter:blur(6px);" +
      "-webkit-backdrop-filter:blur(6px);box-shadow:0 3px 12px rgba(40,90,70,.22);display:flex;" +
      "align-items:center;justify-content:center;cursor:pointer;padding:0;transition:transform .12s;";
    // Icônes signalétiques (pictogramme plein, en dur — aucun fichier à charger).
    var ICON_ON = '<svg width="22" height="22" viewBox="0 0 24 24" fill="#334155" aria-hidden="true">' +
      '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
    var ICON_OFF = '<svg width="22" height="22" viewBox="0 0 24 24" fill="#c0293c" aria-hidden="true">' +
      '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>';
    function render() {
      btn.innerHTML = muted ? ICON_OFF : ICON_ON;
      btn.title = muted ? "Sons coupés — cliquer pour activer" : "Sons activés — cliquer pour couper";
      btn.setAttribute("aria-pressed", muted ? "true" : "false");
    }
    render();
    btn.addEventListener("mouseenter", function () { btn.style.transform = "scale(1.08)"; });
    btn.addEventListener("mouseleave", function () { btn.style.transform = "scale(1)"; });
    btn.addEventListener("click", function () {
      muted = !muted;
      setEnabled(!muted);
      try { localStorage.setItem(MUTE_KEY, muted ? "1" : "0"); } catch (e) {}
      render();
      if (!muted) play("chime"); // petit retour sonore quand on réactive
    });
    document.body.appendChild(btn);
  }
  if (document.body) mountToggle(); else document.addEventListener("DOMContentLoaded", mountToggle);

  // ---- Amorçage : ignorer les sons pendant la restauration automatique ----
  // Au rechargement, platform.js re-clique les sections validées et re-remplit
  // les réponses (restore()) : sans ce garde-fou, ça déclencherait une rafale.
  var armed = false;
  setTimeout(function () { armed = true; }, 2000);

  // ---- Sons sur les interactions (délégués, aucun attribut à ajouter au HTML) ----

  // ---- Menu « maison » pour les réponses (son en survolant chaque choix) ----
  // Sur souris (pointeur fin), on supprime le popup NATIF du <select> et on
  // affiche une liste HTML à la place. Le <select> reste l'élément visible et
  // la SOURCE DE VÉRITÉ : sa valeur, ses classes .correct/.incorrect, son état
  // disabled et la notation ne changent pas — on ne remplace que le popup.
  // Sur tactile, on garde le menu natif (meilleur au doigt).
  var FINE = !!(window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  var menu = null; // { select, panel, items[], optIdx[], idx }

  function onDismiss() { closeMenu(false); }
  function closeMenu(refocus) {
    if (!menu) return;
    var sel = menu.select;
    if (menu.panel && menu.panel.parentNode) menu.panel.parentNode.removeChild(menu.panel);
    window.removeEventListener("scroll", onDismiss, true);
    window.removeEventListener("resize", onDismiss, true);
    menu = null;
    if (refocus && sel) { try { sel.focus(); } catch (e) {} }
  }

  function highlight(i) {
    if (!menu) return;
    var items = menu.items;
    if (i < 0) i = items.length - 1;
    if (i >= items.length) i = 0;
    if (menu.idx >= 0 && items[menu.idx]) items[menu.idx].style.background = "";
    menu.idx = i;
    var it = items[i];
    if (it) {
      it.style.background = "#efe7fb";
      if (it.scrollIntoView) it.scrollIntoView({ block: "nearest" });
      if (armed) play("tick"); // <-- son en naviguant parmi les choix
    }
  }

  function commit(optionIndex) {
    var sel = menu ? menu.select : null;
    closeMenu(true);
    if (!sel) return;
    if (sel.selectedIndex !== optionIndex) {
      sel.selectedIndex = optionIndex;
      sel.dispatchEvent(new Event("input", { bubbles: true }));
      sel.dispatchEvent(new Event("change", { bubbles: true })); // → notation + « tick » de confirmation
    }
  }

  function openMenu(sel) {
    closeMenu(false);
    var cs = window.getComputedStyle(sel);
    var rect = sel.getBoundingClientRect();
    var panel = document.createElement("div");
    panel.setAttribute("role", "listbox");
    panel.style.cssText = "position:fixed;z-index:100001;left:" + Math.round(rect.left) + "px;" +
      "min-width:" + Math.round(rect.width) + "px;max-width:min(420px,90vw);max-height:260px;overflow-y:auto;" +
      "background:#fff;border:2px solid #e7e0f3;border-radius:14px;box-shadow:0 12px 34px rgba(50,60,90,.24);" +
      "padding:6px;box-sizing:border-box;font-family:" + cs.fontFamily + ";font-size:" + cs.fontSize + ";font-weight:700;";
    var items = [], optIdx = [];
    var opts = Array.prototype.slice.call(sel.options);
    for (var k = 0; k < opts.length; k++) {
      var opt = opts[k];
      if (opt.value === "" && !opt.text.trim()) continue; // ignore le placeholder vide
      var it = document.createElement("div");
      it.setAttribute("role", "option");
      it.textContent = opt.text;
      it.style.cssText = "padding:9px 14px;border-radius:10px;cursor:pointer;color:#4a2f6b;white-space:nowrap;";
      if (opt.selected) it.style.background = "#efe7fb";
      var pos = items.length;
      (function (position, optionIndex, node) {
        node.addEventListener("mouseenter", function () { highlight(position); });
        node.addEventListener("mousedown", function (ev) { ev.preventDefault(); }); // ne pas voler le focus avant le clic
        node.addEventListener("click", function () { commit(optionIndex); });
      })(pos, opt.index, it);
      panel.appendChild(it);
      items.push(it); optIdx.push(opt.index);
    }
    if (!items.length) return;
    document.body.appendChild(panel);
    // Sous le select, ou au-dessus si ça déborde en bas.
    var ph = panel.offsetHeight, below = rect.bottom + 4;
    panel.style.top = (below + ph > window.innerHeight && rect.top - 4 - ph > 0)
      ? Math.round(rect.top - 4 - ph) + "px" : Math.round(below) + "px";
    // Recadrer si ça déborde à droite.
    var pr = panel.getBoundingClientRect();
    if (pr.right > window.innerWidth - 6) panel.style.left = Math.round(Math.max(6, window.innerWidth - 6 - pr.width)) + "px";
    menu = { select: sel, panel: panel, items: items, optIdx: optIdx, idx: -1 };
    window.addEventListener("scroll", onDismiss, true);
    window.addEventListener("resize", onDismiss, true);
  }

  // Clic sur un menu de réponse → son « press » + ouverture du menu maison (souris).
  document.addEventListener("mousedown", function (e) {
    var sel = e.target && e.target.closest ? e.target.closest(".card select") : null;
    if (!sel) return;
    if (armed) play("press");
    if (!FINE || sel.disabled) return;                 // tactile / verrouillé → menu natif
    e.preventDefault();                                // supprime le popup natif
    if (menu && menu.select === sel) closeMenu(false); // re-clic sur le même = fermer
    else openMenu(sel);
  }, true);

  // Clic hors du menu ouvert → fermeture.
  document.addEventListener("mousedown", function (e) {
    if (!menu) return;
    if (menu.panel.contains(e.target)) return;                                   // dans le panneau
    if (e.target.closest && e.target.closest(".card select") === menu.select) return; // sur le select (géré au-dessus)
    closeMenu(false);
  }, true);

  // Clavier quand le menu maison est ouvert.
  document.addEventListener("keydown", function (e) {
    if (!menu) return;
    var k = e.key;
    if (k === "ArrowDown") { e.preventDefault(); highlight(menu.idx + 1); }
    else if (k === "ArrowUp") { e.preventDefault(); highlight(menu.idx - 1); }
    else if (k === "Enter" || k === " ") {
      e.preventDefault();
      if (menu.idx >= 0) commit(menu.optIdx[menu.idx]); else closeMenu(true);
    } else if (k === "Escape") { e.preventDefault(); closeMenu(true); }
    else if (k === "Tab") { closeMenu(false); }
  }, true);

  // Choix d'une réponse (valeur du menu changée) → « tick » discret.
  document.addEventListener("change", function (e) {
    if (!armed) return;
    var t = e.target;
    if (t && t.tagName === "SELECT" && t.closest && t.closest(".card")) play("tick");
  }, true);

  // Survol d'un élément interactif (souris fine uniquement, throttlé) → « whisper ».
  var hoverEl = null, hoverAt = -Infinity;
  function hoverable(node) {
    return node && node.closest ? node.closest("button:not(#soundToggle), .card select") : null;
  }
  document.addEventListener("pointerover", function (e) {
    if (!armed || (e.pointerType && e.pointerType !== "mouse")) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    var el = hoverable(e.target);
    if (!el || el === hoverEl) return;
    hoverEl = el;
    var now = (window.performance && performance.now) ? performance.now() : 0;
    if (now - hoverAt < 110) return;
    hoverAt = now;
    play("whisper");
  }, true);
  document.addEventListener("pointerout", function (e) {
    var el = hoverable(e.target);
    if (el && el === hoverEl) hoverEl = null;
  }, true);

  // Boutons d'action (data-act) → un son dédié par action.
  document.addEventListener("click", function (e) {
    if (!armed) return;
    var el = e.target && e.target.closest ? e.target.closest("[data-act]") : null;
    if (!el) return;
    switch (el.getAttribute("data-act")) {
      case "validate":
        // On attend que le carnet ait marqué juste/faux : bouton `done` + texte
        // « Perfect! » si 100 %, sinon `locked`. Repli : aucune réponse .incorrect
        // dans la carte (et au moins une .correct). 100 % → « sparkle », sinon « bloom ».
        (function (btn) {
          setTimeout(function () {
            var card = btn.closest ? btn.closest(".card") : null;
            var perfect = (btn.classList && btn.classList.contains("done")) ||
              (!!card && !card.querySelector(".incorrect") && !!card.querySelector(".correct"));
            play(perfect ? "sparkle" : "bloom");
          }, 60);
        })(el);
        break;
      case "submit":   play("press"); break;   // calcul de la note (le « success » suivra)
      case "reset":    play("page");  break;
      case "pdf":      play("page");  break;
    }
  }, true);

  // Autres boutons (sans data-act, hors bouton mute) → « press » tactile.
  document.addEventListener("pointerdown", function (e) {
    if (!armed) return;
    var b = e.target && e.target.closest ? e.target.closest("button") : null;
    if (!b || b.id === "soundToggle" || b.hasAttribute("data-act")) return;
    play("press");
  }, true);

  // ---- Fin du carnet : « success » à la 1re apparition du code (transition vide→rempli) ----
  // On fige la valeur de départ après l'amorçage : un carnet déjà terminé (code
  // présent au chargement) ne rejoue pas ; seule une vraie complétion sonne.
  function currentCode() {
    var el = document.getElementById("exportCode");
    var v = el ? (el.value || el.textContent || "") : "";
    return v.indexOf("GTEST1::") === 0 ? v.trim() : "";
  }
  var baseline = null; // null tant que l'amorçage n'a pas figé l'état initial
  setInterval(function () {
    var code = currentCode();
    if (baseline === null) { baseline = armed ? code : null; return; }
    if (code && code !== baseline) { baseline = code; play("success"); }
  }, 700);
})();
