/* Carnets d'anglais — MOTEUR de correction /20 + code GTEST1.
   Port fidèle du script de worksheet-b1/templates/template.html (la prod) :
   mêmes ids DOM, mêmes règles (norm, « je ne sais pas », verrouillage, gate par section),
   même objet LAST → même code GTEST1::… (les stats serveur en dépendent : NE PAS MODIFIER
   l'ordre des clés ni les formats sans passer le test `npm test`).

   Différence unique : aucun effet visuel ici. Le moteur émet des événements que la couche
   design (carnet-ui.js) écoute :
     carnet:progress {done,total}      carnet:item {id,ok,el}
     carnet:section  {name,sc,max,perfect,btn}     carnet:submit {last,win,ratio}
     carnet:reset
   Les données viennent de window.CARNET = {test, ans, sections, theme, ps:{title,sub}}
   (posées par la page, générées depuis la fiche JSON). */
(function () {
  var C = window.CARNET; if (!C) return;
  var ANS = C.ans, SECTIONS = C.sections, THEME = C.theme, TEST_NAME = C.test, PS = C.ps || {};
  var TOTAL = (function(){var n=0;for(var k in ANS){if(ANS.hasOwnProperty(k))n++;}return n;})();
  var LABELS = {};
  (function(){for(var s=0;s<SECTIONS.length;s++){var sec=SECTIONS[s],p=sec.name.split(" ")[0];
    for(var i=0;i<sec.ids.length;i++){LABELS[sec.ids[i]]=p+"."+(i+1);}}})();
  var ALLIDS = (function(){var a=[];for(var s=0;s<SECTIONS.length;s++)a=a.concat(SECTIONS[s].ids);return a;})();
  var LAST=null;

  function emit(name, detail){try{document.dispatchEvent(new CustomEvent(name,{detail:detail||{}}));}catch(e){}}
  function norm(s){return (s||"").toLowerCase().replace(/[‘’ʼ′`]/g,"'").replace(/[.,;:!?…–—]/g,"").replace(/\s+/g," ").trim();}
  function isCorrect(id,val){var v=norm(val);if(v==="")return false;var a=ANS[id];for(var i=0;i<a.length;i++){if(norm(a[i])===v)return true;}return false;}
  function getVal(id){var el=document.getElementById(id);return el?el.value:"";}
  function $(id){return document.getElementById(id);}
  function setText(id,t){var el=$(id);if(el)el.textContent=t;}

  // progression en direct
  function updateProgress(){
    var done=0;for(var i=0;i<ALLIDS.length;i++){if((getVal(ALLIDS[i])||"")!=="")done++;}
    var pct=Math.round(done/TOTAL*100);
    var bar=$("bar");if(bar)bar.style.width=pct+"%";
    setText("progTxt",done+" / "+TOTAL+(done===TOTAL?" ✅ ready!":" ✍️"));
    emit("carnet:progress",{done:done,total:TOTAL});
  }
  // neutre pendant la saisie : on efface vert/rouge dès qu'une réponse change (recoloré à la validation)
  document.addEventListener("change",function(e){if(e.target&&e.target.tagName==="SELECT"){e.target.classList.remove("correct","incorrect");updateProgress();}});

  // --- le « Check my answers » final n'apparaît qu'une fois CHAQUE section validée ---
  var VALIDATED={};
  function updateSubmitGate(){
    var done=0;for(var s=0;s<SECTIONS.length;s++){if(VALIDATED[SECTIONS[s].name])done++;}
    var all=done>=SECTIONS.length;
    var btns=document.querySelectorAll('[data-act="submit"]');
    for(var i=0;i<btns.length;i++){btns[i].style.display=all?"":"none";}
    var hints=document.querySelectorAll('.gate-hint');
    for(var j=0;j<hints.length;j++){
      if(all){hints[j].style.display="none";}
      else{hints[j].style.display="";hints[j].textContent="🔒 Valide chaque section ("+done+" / "+SECTIONS.length+")";}
    }
  }

  // marquer un item : couleur, révéler la bonne réponse si faux, puis VERROUILLER
  function lockReveal(el,id,ok){
    el.classList.remove("correct","incorrect");
    el.classList.add(ok?"correct":"incorrect");
    var prev=el.parentNode.querySelector('.answer-reveal[data-for="'+id+'"]');
    if(prev)prev.remove();
    if(!ok){
      var a=ANS[id];var sol=(a&&a.length)?a[0]:"";
      var span=document.createElement("span");
      span.className="answer-reveal";span.setAttribute("data-for",id);span.textContent=sol;
      el.parentNode.insertBefore(span,el.nextSibling);
    }
    el.disabled=true;
    emit("carnet:item",{id:id,ok:ok,el:el});
  }

  // valider UNE section ; révèle + verrouille
  function validateSection(name,btn){
    var sec=null;for(var s=0;s<SECTIONS.length;s++){if(SECTIONS[s].name===name){sec=SECTIONS[s];break;}}
    if(!sec)return;
    var sc=0;
    for(var i=0;i<sec.ids.length;i++){
      var el=document.getElementById(sec.ids[i]);if(!el)continue;
      var ok=isCorrect(sec.ids[i],el.value);
      lockReveal(el,sec.ids[i],ok);
      if(ok)sc++;
    }
    var max=sec.ids.length,msg=btn.parentNode.querySelector(".modmsg");
    btn.disabled=true;
    VALIDATED[name]=true; updateSubmitGate();
    if(sc===max){
      btn.classList.add("done");btn.textContent="✓ Perfect!";
      if(msg)msg.textContent=sc+" / "+max+" 🎉";
    }else{
      btn.classList.add("locked");btn.textContent="🔒 Corrigé";
      if(msg)msg.textContent=sc+" / "+max+" — réponses corrigées 👇";
    }
    emit("carnet:section",{name:name,sc:sc,max:max,perfect:sc===max,btn:btn});
  }

  function submitPaper(){
    var score=0,perSection=[],items=[];
    for(var s=0;s<SECTIONS.length;s++){
      var sec=SECTIONS[s],sc=0;
      for(var i=0;i<sec.ids.length;i++){
        var id=sec.ids[i],el=document.getElementById(id);if(!el)continue;
        var given=el.value,ok=isCorrect(id,given);
        lockReveal(el,id,ok);
        if(ok){sc++;score++;}
        items.push({id:id,label:LABELS[id]||id,section:sec.name,theme:(THEME[id]||sec.name),ok:ok?1:0,given:(given==="__blank__"?"(blanc)":(given||"").trim())});
      }
      perSection.push({name:sec.name,sc:sc,max:sec.ids.length});
    }
    var vbtns=document.querySelectorAll('.btn-val');
    for(var vb=0;vb<vbtns.length;vb++){ if(!vbtns[vb].disabled){ vbtns[vb].disabled=true; vbtns[vb].classList.add("locked"); vbtns[vb].textContent="🔒 Corrigé"; } }
    var out20=Math.round((score/TOTAL)*20*2)/2;
    LAST={test:TEST_NAME,name:(getVal("stuName")||"").trim(),
      cls:(getVal("stuClass")||"").trim(),date:new Date().toLocaleDateString("fr-FR"),
      submitted:new Date().toISOString(),score:score,total:TOTAL,out20:out20,sections:perSection,items:items};

    setText("scoreNum",out20.toString().replace(".",",")+" / 20");

    var b=$("banner");
    var ratio=score/TOTAL,win=ratio>=0.6;
    if(b){b.classList.add("show");b.classList.toggle("win",win);}
    setText("bEmo", ratio>=0.9?"🏆":ratio>=0.6?"🎉":ratio>=0.4?"💪":"🔧");
    setText("bTitle", LAST.name?("Nice one, "+LAST.name+"!"):"Your result");
    var dial=$("bDial");if(dial)dial.innerHTML = out20.toString().replace(".",",")+" <span class='u'>/ 20</span>";
    var subs="";
    for(var p=0;p<perSection.length;p++){subs+="<span>"+perSection[p].name+" <b>"+perSection[p].sc+"/"+perSection[p].max+"</b></span>";}
    var bs=$("bSubs");if(bs)bs.innerHTML=subs;

    var ec=$("exportCode");
    if(!LAST.name){if(ec)ec.value="⚠ Écris ton NOM en haut, puis clique encore !";}
    else{if(ec)ec.value="GTEST1::"+btoa(unescape(encodeURIComponent(JSON.stringify(LAST))));}

    if(b)b.scrollIntoView({behavior:"smooth",block:"center"});
    emit("carnet:submit",{last:LAST,win:win,ratio:ratio,score:score,total:TOTAL,out20:out20});
  }

  // fiche résultat imprimable (Enregistrer en PDF)
  function buildPrintSheet(){
    if(!LAST) return;
    var rows="";
    for(var p=0;p<LAST.sections.length;p++){
      var ps=LAST.sections[p];
      rows+="<tr><td>"+ps.name+"</td><td class='v'>"+ps.sc+" / "+ps.max+"</td></tr>";
    }
    var code=($("exportCode")||{}).value||"";
    var sheet=$("printSheet");if(!sheet)return;
    sheet.innerHTML=
      "<div class='ps-card'>"
     +"<div class='ps-head'><div class='ps-title'>"+(PS.title||"")+"</div>"
     +"<div class='ps-sub'>"+(PS.sub||"")+"</div></div>"
     +"<div class='ps-id'><b>"+(LAST.name||"—")+"</b> &nbsp;·&nbsp; "+(LAST.cls||"")+" &nbsp;·&nbsp; "+(LAST.date||"")+"</div>"
     +"<div class='ps-mark'>"+LAST.out20.toString().replace(".",",")+" / 20 <span>("+LAST.score+" / "+LAST.total+" correct)</span></div>"
     +"<table class='ps-table'>"+rows+"</table>"
     +"<div class='ps-codeh'>Result code (for the teacher)</div><div class='ps-code'>"+code+"</div>"
     +"</div>";
  }
  function exportPDF(){
    if(!LAST||!LAST.name){alert("Écris ton NOM en haut, puis clique sur « Check my answers ! » avant d'exporter.");return;}
    buildPrintSheet();
    document.body.classList.add("print-result");
    setTimeout(function(){window.print();},60);
  }
  window.addEventListener("afterprint",function(){document.body.classList.remove("print-result");});

  function copyCode(){
    var ta=$("exportCode");if(!ta)return;
    if(!ta.value||ta.value.indexOf("GTEST1::")!==0){alert("Écris d'abord ton NOM en haut, puis clique sur « Check my answers ! » avant de copier.");return;}
    ta.select();ta.setSelectionRange(0,99999);var done=false;
    try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(ta.value);done=true;}else{done=document.execCommand("copy");}}
    catch(e){try{done=document.execCommand("copy");}catch(e2){}}
    var btn=$("copyBtn");
    if(btn){btn.textContent=done?"✓ Copié !":"Sélectionne le code";btn.classList.toggle("done",done);
      setTimeout(function(){btn.textContent="⧉ Copier mon code";btn.classList.remove("done");},2500);}
  }

  function resetAll(){
    for(var i=0;i<ALLIDS.length;i++){var el=document.getElementById(ALLIDS[i]);if(!el)continue;el.selectedIndex=0;el.disabled=false;el.classList.remove("correct","incorrect");}
    var rev=document.querySelectorAll(".answer-reveal");for(var r=0;r<rev.length;r++)rev[r].remove();
    var vbtns=document.querySelectorAll(".btn-val");for(var vb=0;vb<vbtns.length;vb++){var bn=vbtns[vb];bn.disabled=false;bn.classList.remove("done","locked");bn.textContent="✓ Validate";var mm=bn.parentNode.querySelector(".modmsg");if(mm)mm.textContent="";}
    VALIDATED={}; updateSubmitGate();
    setText("scoreNum","— / 20");
    var ec=$("exportCode");if(ec)ec.value="";
    LAST=null;var b=$("banner");if(b)b.classList.remove("show","win");
    updateProgress();window.scrollTo({top:0,behavior:"smooth"});
    emit("carnet:reset",{});
  }

  // tous les boutons par délégation (fiable sur mobile)
  document.addEventListener("click",function(e){
    var t=e.target,b=(t&&t.closest)?t.closest("[data-act]"):null;
    if(!b)return;
    var act=b.getAttribute("data-act");
    if(act!=="submit"&&act!=="reset"&&act!=="copy"&&act!=="pdf"&&act!=="validate")return;
    e.preventDefault();
    if(act==="submit")submitPaper();
    else if(act==="reset")resetAll();
    else if(act==="copy")copyCode();
    else if(act==="pdf")exportPDF();
    else if(act==="validate")validateSection(b.getAttribute("data-sec"),b);
  },false);

  // mélange des options de CHAQUE menu (garde option[0] = vide)
  (function(){
    function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
    for(var i=0;i<ALLIDS.length;i++){
      var el=document.getElementById(ALLIDS[i]); if(!el) continue;
      var opts=[]; for(var k=1;k<el.options.length;k++){opts.push(el.options[k]);}
      shuffle(opts);
      for(var j2=0;j2<opts.length;j2++){el.appendChild(opts[j2]);}
    }
  })();
  // choix explicite « je ne sais pas » : compte comme répondu, toujours faux
  (function(){
    for(var i=0;i<ALLIDS.length;i++){
      var el=document.getElementById(ALLIDS[i]); if(!el) continue;
      if(el.querySelector('option[value="__blank__"]')) continue;
      var o=document.createElement("option"); o.value="__blank__"; o.textContent="— je ne sais pas —";
      if(el.options.length>1) el.add(o,el.options[1]); else el.add(o);
    }
  })();
  updateProgress();
  updateSubmitGate();

  window.Carnet={submit:submitPaper,reset:resetAll,validate:validateSection,norm:norm,isCorrect:isCorrect,
    last:function(){return LAST;},total:TOTAL,ids:ALLIDS,sections:SECTIONS};
})();
