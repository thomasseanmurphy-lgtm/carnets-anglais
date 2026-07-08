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
