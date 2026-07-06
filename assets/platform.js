/* Carnets d'anglais — branchement plateforme.
   Ajouté à chaque carnet : quand l'élève a soumis (code GTEST1 prêt),
   affiche un bouton « Envoyer mes résultats » qui POST vers l'API,
   puis un lien vers sa page perso « Ma progression ». Additif : ne touche pas au carnet. */
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
      try { localStorage.setItem(stateKey, JSON.stringify(st)); } catch (e) {}
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

  // Panneau flottant
  var bar = document.createElement("div");
  bar.id = "platformBar";
  bar.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:99999;display:none;justify-content:center;gap:10px;flex-wrap:wrap;padding:12px 16px;background:rgba(255,255,255,.96);box-shadow:0 -6px 24px rgba(40,90,70,.16);font-family:system-ui,-apple-system,sans-serif;";
  bar.innerHTML =
    '<button id="pfSend" style="background:#127a55;color:#fff;border:none;border-radius:12px;padding:12px 20px;font-size:15px;font-weight:700;cursor:pointer;">📤 Envoyer mes résultats</button>' +
    '<a id="pfMe" href="#" target="_blank" rel="noopener" style="display:none;align-items:center;background:#eafaf3;color:#127a55;border-radius:12px;padding:12px 18px;font-size:14px;font-weight:700;text-decoration:none;">📊 Voir ma progression →</a>' +
    '<span id="pfMsg" style="display:none;align-items:center;color:#5f6a75;font-size:13px;"></span>';
  function mount() { if (!document.getElementById("platformBar")) document.body.appendChild(bar); }
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);

  var sendBtn = bar.querySelector("#pfSend"), meLink = bar.querySelector("#pfMe"), msg = bar.querySelector("#pfMsg");

  function showMe(url) { meLink.href = url; meLink.style.display = "inline-flex"; }
  var saved = null; try { saved = localStorage.getItem(storeKey); } catch (e) {}
  if (saved) showMe(saved);

  // Révèle la barre dès qu'un code valide existe (après soumission du carnet)
  var seen = false;
  setInterval(function () {
    var code = getCode();
    if (code && !seen) { seen = true; bar.style.display = "flex"; }
    if (!code && seen && !saved) { /* garde la barre visible */ }
  }, 1000);

  sendBtn.addEventListener("click", function () {
    var code = getCode();
    if (!code) { flash("Termine d'abord le carnet et clique sur « Submit » (ta note doit s'afficher).", true); return; }
    sendBtn.disabled = true; sendBtn.textContent = "Envoi…";
    fetch(API + "/api/submit", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classId: classId, slug: slug, code: code })
    }).then(function (r) { return r.json(); }).then(function (d) {
      if (d && d.ok) {
        sendBtn.style.display = "none";
        try { localStorage.setItem(storeKey, d.meUrl); } catch (e) {}
        showMe(d.meUrl);
        flash("✅ Résultats envoyés (" + String(d.out20).replace(".", ",") + "/20).");
      } else {
        sendBtn.disabled = false; sendBtn.textContent = "📤 Envoyer mes résultats";
        flash(d && d.error === "no_name" ? "Écris ton NOM en haut du carnet, puis Submit à nouveau." : "Échec de l'envoi, réessaie.", true);
      }
    }).catch(function () {
      sendBtn.disabled = false; sendBtn.textContent = "📤 Envoyer mes résultats";
      flash("Pas de connexion — réessaie.", true);
    });
  });

  function flash(text, warn) { msg.textContent = text; msg.style.color = warn ? "#c8871f" : "#2e9e6e"; msg.style.display = "inline-flex"; }
})();
