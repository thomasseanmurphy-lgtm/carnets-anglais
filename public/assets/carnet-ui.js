/* Carnets d'anglais — COUCHE DESIGN (port de _rebuild/mockup.html).
   Skins, réglages, avatars DiceBear, paillettes, mascotte, karaoké, dico au tap, barre de statut.
   Écoute les événements du moteur (carnet-engine.js) ; ne touche ni à la note ni au code GTEST1.
   Sons : fournis par platform.js (window.CarnetSound, palette Cuelume) — rien n'est dupliqué ici. */
(function () {
  var C = window.CARNET || {};
  function $(id){return document.getElementById(id);}
  function snd(name){try{if(window.CarnetSound&&$('sound').checked)window.CarnetSound.play(name);}catch(e){}}
  function calm(){var c=$('calm');return (c&&c.checked)||matchMedia('(prefers-reduced-motion: reduce)').matches;}

  /* ---------- identité (nom → barre du haut / du bas / mascotte) ---------- */
  function studentName(){var el=$('stuName');return el?(el.value||'').trim():'';}
  function syncWho(){var n=studentName()||'—';var a=$('whoName'),b=$('whoName2');if(a)a.textContent=n;if(b)b.textContent=n;}
  document.addEventListener('input',function(e){if(e.target&&e.target.id==='stuName')syncWho();});
  document.addEventListener('change',function(e){if(e.target&&(e.target.id==='stuName'||e.target.id==='stuNameSelect'))setTimeout(syncWho,0);});
  setTimeout(syncWho,500); // après la restauration par platform.js

  /* ---------- AVATARS (DiceBear, banques par style) ---------- */
  var AV_STYLES=[['bottts','🛸 Robots'],['pixel-art','🎮 Pixel'],['adventurer','🧚 Fantaisie'],['avataaars','🎤 Perso'],['fun-emoji','😀 Fun'],['big-ears','🐨 Mignon']];
  var SEEDS=['Milo','Zoe','Max','Nina','Leo','Kira','Sam','Ava','Rex','Lily','Neo','Jade','Finn','Cleo','Otis','Suki'];
  var ava={style:localStorage.getItem('ava_style')||'bottts',seed:localStorage.getItem('ava_seed')||'Milo'};
  function avaUrl(style,seed){return 'https://api.dicebear.com/9.x/'+style+'/svg?radius=50&seed='+encodeURIComponent(seed);}
  function applyAva(){document.querySelectorAll('[data-ava]').forEach(function(e){e.innerHTML='<img alt="" src="'+avaUrl(ava.style,ava.seed)+'">';});}
  var avStyle=ava.style, gridSeeds=SEEDS.slice(0,8);
  function buildAvGrid(){var g=$('avgrid');if(!g)return;g.innerHTML='';gridSeeds.forEach(function(s){var b=document.createElement('button');b.type='button';
    b.innerHTML='<img alt="" src="'+avaUrl(avStyle,s)+'">';if(avStyle===ava.style&&s===ava.seed)b.classList.add('on');
    b.onclick=function(){ava={style:avStyle,seed:s};localStorage.setItem('ava_style',avStyle);localStorage.setItem('ava_seed',s);applyAva();buildAvGrid();snd('press');};g.appendChild(b);});}
  (function(){var c=$('avstyles');if(!c)return;AV_STYLES.forEach(function(t){var b=document.createElement('button');b.type='button';
    b.textContent=t[1];if(t[0]===avStyle)b.classList.add('on');b.onclick=function(){avStyle=t[0];
      document.querySelectorAll('#avstyles button').forEach(function(x){x.classList.remove('on');});b.classList.add('on');buildAvGrid();};c.appendChild(b);});buildAvGrid();})();
  var sh=$('avshuffle');if(sh)sh.onclick=function(){gridSeeds=[];for(var i=0;i<8;i++)gridSeeds.push('r'+Math.floor(Math.random()*1e6));buildAvGrid();snd('tick');};

  /* ---------- SKINS (fonds) ---------- */
  var THEMES=[['aurore','🌅 Aurore','linear-gradient(135deg,#ffd9b3,#c9b8ff,#b9f0dd)'],['hiphop','🎤 Hip-hop','linear-gradient(135deg,#7a1fa2,#ff2d95,#ffb020)'],
    ['animaux','🐾 Animaux','linear-gradient(135deg,#7ed36a,#bfe3ff,#ffce7a)'],['hardrock','🎸 Hard Rock','linear-gradient(135deg,#141418,#e23b3b,#b8c0cc)'],
    ['fantaisie','🧚 Fantaisie','linear-gradient(135deg,#7c3aed,#ec4899,#2dd4bf)'],['scifi','🛸 Sci-fi','linear-gradient(135deg,#22d3ee,#c026d3,#1d4ed8)']];
  var theme=localStorage.getItem('theme')||'aurore';
  function applyTheme(){document.documentElement.dataset.theme=theme;document.querySelectorAll('#themes button').forEach(function(b){b.classList.toggle('on',b.dataset.t===theme);});applyMascot();}
  (function(){var c=$('themes');if(!c)return;THEMES.forEach(function(t){var b=document.createElement('button');b.type='button';b.dataset.t=t[0];
    b.innerHTML='<span class="sw" style="background:'+t[2]+'"></span><span class="tn">'+t[1]+'</span>';
    b.onclick=function(){theme=t[0];localStorage.setItem('theme',theme);applyTheme();snd('toggle');};c.appendChild(b);});})();

  /* ---------- popovers ---------- */
  var POPS=['avatarPop','settingsPop','skinPop'];
  function closePops(){POPS.forEach(function(id){var p=$(id);if(p)p.classList.remove('show');});}
  function togglePop(id){var p=$(id),open=p.classList.contains('show');closePops();if(!open)p.classList.add('show');}
  $('avatarBtn').onclick=function(e){e.stopPropagation();togglePop('avatarPop');};
  $('skinBtn').onclick=function(e){e.stopPropagation();togglePop('skinPop');};
  $('gearBtn').onclick=function(e){e.stopPropagation();togglePop('settingsPop');};
  document.addEventListener('click',function(e){if(!POPS.some(function(id){var p=$(id);return p&&p.contains(e.target);}))closePops();});

  /* ---------- réglages : son (= préférence mute de platform.js), mode calme, FR, mascotte ---------- */
  (function(){var s=$('sound');var MUTE_KEY='carnet_sound_off';
    s.checked=localStorage.getItem(MUTE_KEY)!=='1';
    s.addEventListener('change',function(){try{localStorage.setItem(MUTE_KEY,this.checked?'0':'1');}catch(e){}
      if(window.CarnetSound)window.CarnetSound.setEnabled(this.checked);if(this.checked)snd('chime');});
    var c=$('calm');c.checked=localStorage.getItem('calm_on')==='1';c.addEventListener('change',function(){localStorage.setItem('calm_on',this.checked?'1':'0');});
    var fr=$('frToggle');fr.checked=localStorage.getItem('fr_on')==='1';fr.addEventListener('change',function(){localStorage.setItem('fr_on',this.checked?'1':'0');});})();

  /* ---------- cascade d'entrée ---------- */
  function cascade(view){view.querySelectorAll('.pop-in').forEach(function(e,i){e.classList.remove('go');void e.offsetWidth;e.style.setProperty('--d',(Math.min(i,8)*0.07)+'s');e.classList.add('go');});}

  /* ---------- timer de session ---------- */
  var s0=Date.now();function tick(){var s=Math.floor((Date.now()-s0)/1000),m=String(Math.floor(s/60)).padStart(2,'0'),ss=String(s%60).padStart(2,'0');
    var a=$('timer'),b=$('timer2');if(a)a.textContent='⏱ '+m+':'+ss;if(b)b.textContent=m+':'+ss;}
  tick();setInterval(tick,1000);

  /* ---------- parallaxe hero ---------- */
  var hero=$('hero'),em=hero&&hero.querySelector('.em');
  if(hero&&em){hero.addEventListener('mousemove',function(e){if(calm())return;var r=hero.getBoundingClientRect();var dx=(e.clientX-r.left)/r.width-.5,dy=(e.clientY-r.top)/r.height-.5;
      hero.style.transform='perspective(900px) rotateY('+(dx*5)+'deg) rotateX('+(-dy*5)+'deg)';em.style.transform='translate('+(-dx*26)+'px,'+(-dy*20)+'px)';});
    hero.addEventListener('mouseleave',function(){hero.style.transform='';em.style.transform='';});
    addEventListener('scroll',function(){if(!calm())em.style.transform='translateY('+(scrollY*0.18)+'px)';});}

  /* ---------- KARAOKÉ (voix ElevenLabs si audio/<slug>.mp3 + .words.json ; sinon voix du navigateur) ---------- */
  function wrapWords(root){(function walk(node){Array.prototype.slice.call(node.childNodes).forEach(function(n){
    if(n.nodeType===3){var parts=n.textContent.split(/(\s+)/),frag=document.createDocumentFragment();
      parts.forEach(function(p){if(p===''){return;}if(/^\s+$/.test(p)){frag.appendChild(document.createTextNode(p));}
        else{var sp=document.createElement('span');sp.className='w';sp.textContent=p;frag.appendChild(sp);}});
      n.parentNode.replaceChild(frag,n);}
    else if(n.nodeType===1&&!n.classList.contains('w')){walk(n);}});})(root);}
  var story=$('story');if(story)wrapWords(story);
  var synth=window.speechSynthesis,words=[],kTimer=null,kAudio=null;
  function clearReading(){words.forEach(function(w){w.classList.remove('reading');});}
  function hl(i){clearReading();if(words[i]){words[i].classList.add('reading');words[i].scrollIntoView({block:'center',behavior:calm()?'auto':'smooth'});}}
  function stopK(){if(synth)synth.cancel();if(kTimer){clearInterval(kTimer);kTimer=null;}if(kAudio){kAudio.pause();kAudio=null;}clearReading();var b=$('karaoke');if(b){b.classList.remove('on');b.innerHTML='🎧 Écouter';}mascotListen(false);}
  function startK(){
    words=Array.prototype.slice.call(document.querySelectorAll('#story .w'));if(!words.length)return;
    var b=$('karaoke');b.classList.add('on');b.innerHTML='⏸ Stop';mascotListen(true);
    fetch(C.audio+'.words.json').then(function(r){if(!r.ok)throw 0;return r.json();}).then(function(T){
      kAudio=new Audio(C.audio+'.mp3');hl(0);
      kAudio.ontimeupdate=function(){var t=kAudio.currentTime,idx=-1;for(var i=0;i<T.length&&i<words.length;i++){if(t>=T[i].start)idx=i;else break;}if(idx>=0)hl(idx);};
      kAudio.onended=stopK;kAudio.play();
    }).catch(function(){startTTS();});
  }
  function startTTS(){
    if(!synth){var i=0;hl(0);kTimer=setInterval(function(){i++;if(i>=words.length){stopK();return;}hl(i);},320);return;}
    var text=words.map(function(w){return w.textContent;}).join(' ');
    var offs=[],pos=0;words.forEach(function(w){offs.push([pos,pos+w.textContent.length]);pos+=w.textContent.length+1;});
    var u=new SpeechSynthesisUtterance(text);u.lang='en-GB';u.rate=.9;
    var vs=synth.getVoices(),en=vs.filter(function(v){return /^en/i.test(v.lang);});if(en.length)u.voice=en[0];
    var fired=false;hl(0);
    u.onboundary=function(e){if(e.name&&e.name!=='word')return;fired=true;var ci=e.charIndex||0;for(var k=0;k<offs.length;k++){if(ci<offs[k][1]){hl(k);break;}}};
    u.onend=function(){stopK();};synth.cancel();synth.speak(u);
    setTimeout(function(){if(!fired){var i=0;kTimer=setInterval(function(){i++;if(i>=words.length){stopK();return;}hl(i);},Math.round(60000/(150*u.rate)));}},700);
  }
  var kb=$('karaoke');if(kb)kb.onclick=function(){if((synth&&synth.speaking)||kTimer||kAudio){stopK();}else{startK();}};

  /* ---------- DICO AU TAP (bilingue FR + EN) + Mon vocabulaire (localStorage, affiché au Niveau 1) ---------- */
  var GLOSSARY=C.glossary||{};
  function cleanWord(t){return (t||'').toLowerCase().replace(/[^a-z’'\-]/g,'');}
  var VKEY='carnet_vocab';
  function getVocab(){try{return JSON.parse(localStorage.getItem(VKEY)||'[]');}catch(e){return[];}}
  function saveVocab(v){try{localStorage.setItem(VKEY,JSON.stringify(v));}catch(e){}}
  function addVocab(word,fr,en){var v=getVocab();if(v.some(function(x){return x.word===word;}))return;v.push({word:word,fr:fr||'',en:en||'',carnet:C.title||'',at:new Date().toISOString()});saveVocab(v);}
  function removeVocab(word){saveVocab(getVocab().filter(function(x){return x.word!==word;}));}
  function pronounce(word){if(window.speechSynthesis){var u=new SpeechSynthesisUtterance(word);u.lang='en-GB';speechSynthesis.speak(u);}}
  function showWordPop(el,word){
    var pop=$('wordpop'),r=el.getBoundingClientRect();
    pop.style.left=Math.max(12,Math.min(r.left,innerWidth-292))+'px';pop.style.top=(r.bottom+8)+'px';
    pop.innerHTML='<div class="wp-load">Recherche de « '+word+' »…</div>';pop.classList.add('show');
    function render(phon,pos,fr,en,ex){
      pop.innerHTML='<div class="wp-top"><span class="wp-word">'+word+'</span>'+(phon?'<span class="wp-phon">'+phon+'</span>':'')+'</div>'
        +(fr?'<div class="wp-fr">🇫🇷 '+fr+'</div>':'')+(pos?'<div class="wp-pos">'+pos+'</div>':'')+(en?'<div class="wp-def">'+en+'</div>':'')+(ex?'<div class="wp-ex">"'+ex+'"</div>':'')
        +'<div class="wp-actions"><button class="wp-say" type="button" title="Prononcer">🔊</button><span class="wp-added">✓ ajouté à Mon vocabulaire</span><span class="wp-rm">retirer</span></div>';
      pop.querySelector('.wp-say').onclick=function(ev){ev.stopPropagation();pronounce(word);};
      pop.querySelector('.wp-rm').onclick=function(ev){ev.stopPropagation();removeVocab(word);var a=pop.querySelector('.wp-added');a.textContent='retiré';a.style.color='var(--muted)';this.style.display='none';};
    }
    snd('press');
    var frOn=$('frToggle').checked;
    if(GLOSSARY[word]){var g=GLOSSARY[word];addVocab(word,g.fr,g.en);render('','',frOn?g.fr:'',g.en,'');return;}
    var pEN=fetch('https://en.wiktionary.org/api/rest_v1/page/definition/'+encodeURIComponent(word))
      .then(function(r){if(!r.ok)throw 0;return r.json();})
      .then(function(j){var en=j.en||[];if(!en.length)throw 0;var d0=(en[0].definitions||[])[0]||{};
        var ex='';if(d0.parsedExamples&&d0.parsedExamples[0])ex=(d0.parsedExamples[0].example||'').replace(/<[^>]+>/g,'');
        return {pos:en[0].partOfSpeech||'',def:(d0.definition||'').replace(/<[^>]+>/g,'').trim(),ex:ex};})
      .catch(function(){return null;});
    var pFR=frOn?fetch('https://api.mymemory.translated.net/get?q='+encodeURIComponent(word)+'&langpair=en|fr')
      .then(function(r){return r.ok?r.json():null;}).then(function(j){return (j&&j.responseData&&j.responseData.translatedText)||'';}).catch(function(){return '';}):Promise.resolve('');
    Promise.all([pEN,pFR]).then(function(res){var e=res[0],fr=res[1]||'';
      if(!e&&!fr){pop.innerHTML='<div class="wp-top"><span class="wp-word">'+word+'</span></div><div class="wp-def">Pas de définition trouvée.</div>';return;}
      addVocab(word,fr,e?e.def:'');render('',e?e.pos:'',fr,e?e.def:'',e?e.ex:'');});
  }
  if(story)story.addEventListener('click',function(e){var w=e.target.closest('.w');if(!w)return;e.stopPropagation();var word=cleanWord(w.textContent);if(word)showWordPop(w,word);});
  document.addEventListener('click',function(e){var pop=$('wordpop');if(pop.classList.contains('show')&&!pop.contains(e.target)&&!(e.target.closest&&e.target.closest('#story .w')))pop.classList.remove('show');});

  /* ---------- PAILLETTES (✨ réponse → 🎉 section → 🏆 victoire) ---------- */
  var cv=$('fx'),ctx2=cv.getContext&&cv.getContext('2d'),parts=[],raf=null;
  function rs(){cv.width=innerWidth;cv.height=innerHeight;}rs();addEventListener('resize',rs);
  function star(c,sz){c.beginPath();for(var i=0;i<4;i++){var a=i*Math.PI/2;c.lineTo(Math.cos(a)*sz/2,Math.sin(a)*sz/2);c.lineTo(Math.cos(a+Math.PI/4)*sz/6,Math.sin(a+Math.PI/4)*sz/6);}c.closePath();c.fill();}
  function push(x,y,o){if(!ctx2)return;for(var i=0;i<o.n;i++){var a=Math.random()*6.283,sp=o.spd*(0.4+Math.random());parts.push({x:x,y:y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-o.up,g:o.grav,size:o.size*(0.6+Math.random()*0.8),rot:Math.random()*6.28,vr:(Math.random()-.5)*.4,color:o.colors[Math.random()*o.colors.length|0],life:o.life*(0.7+Math.random()*0.8),age:0,shape:o.shape});}if(!raf)raf=requestAnimationFrame(tick2);}
  function tick2(){ctx2.clearRect(0,0,cv.width,cv.height);for(var i=parts.length-1;i>=0;i--){var p=parts[i];p.age++;p.vy+=p.g;p.vx*=.99;p.x+=p.vx;p.y+=p.vy;p.rot+=p.vr;var al=Math.max(0,1-p.age/p.life);ctx2.save();ctx2.globalAlpha=al;ctx2.translate(p.x,p.y);ctx2.rotate(p.rot);ctx2.fillStyle=p.color;if(p.shape==='star')star(ctx2,p.size);else ctx2.fillRect(-p.size/2,-p.size/2,p.size,p.size*.6);ctx2.restore();if(p.age>=p.life||p.y>cv.height+40)parts.splice(i,1);}if(parts.length)raf=requestAnimationFrame(tick2);else{raf=null;ctx2.clearRect(0,0,cv.width,cv.height);}}
  var GOLD=['#00f0ff','#ff2fd0','#b6ff00','#ffffff','#ffe600'],CONF=['#ff2fd0','#00f0ff','#b6ff00','#ff9e00','#a24bff','#ffe600','#ff1493'];
  function spark(x,y){if(calm())return;push(x,y,{n:14,spd:5,up:1.2,grav:.12,size:8,life:36,colors:GOLD,shape:'star'});}
  function burst(x,y){if(calm())return;push(x,y,{n:70,spd:8,up:4,grav:.18,size:9,life:70,colors:CONF,shape:'rect'});}
  function mega(){if(calm())return;burst(innerWidth/2,innerHeight*.4);var n=0,iv=setInterval(function(){burst(Math.random()*innerWidth,Math.random()*innerHeight*.5);if(++n>=8)clearInterval(iv);},150);}

  /* ---------- MASCOTTE (un personnage par skin ; parle anglais ; respecte le mode calme) ---------- */
  var MASCOTS={aurore:['🐿️','Pip'],hiphop:['🦊','Flow'],animaux:['🐼','Bamboo'],hardrock:['🐺','Riff'],fantaisie:['🐲','Ember'],scifi:['🤖','Bolt']};
  var LINES={
    greet:['Hi {n}! 👋','Ready, {n}? Let\'s go! 💪','Hello {n}! Let\'s practise 📖'],
    good:['Nice! ✨','Well done!','Yes! 👍','Spot on!','Great job!','Brilliant!','You\'ve got it!','Perfect!'],
    bad:['Try again! 🙂','Almost!','Not quite — keep going!','No worries, next one!','Oops! Look at the clue 👀','Close! You\'ll get it'],
    section:['Section done! 🎉','All answered! 🎉','That\'s the whole section! 🎉'],
    perfect:['Perfect section! 🌟','All correct! 🌟','Flawless! 🌟'],
    mixed:['Good try — check the corrections 👇','Nearly there! Look at the green ones 👇','Keep going, {n}! 💪'],
    win:['You did it! 🏆','Champion! 🏆','Carnet finished — amazing! 🥳'],
    done:['Finished! Well done, {n} 💪','Carnet done! 🎉','Good work, {n}! Next time even better 🔧'],
    tap:['I\'m {m}! 🙂','Tap a word to see its meaning 📖','Press 🎧 to hear the story!','Change my look with 🎨','Validate each section to see the sparkles ✨','You\'re doing great, {n}!'],
    swap:['Hi! I\'m {m} 🙂','{m} here! 👋','New look, same team 💪'],
    listen:['Listen! 🎧','Follow the words 👀']
  };
  var mEl=$('mascot'),mBody=$('mbody'),mFace=$('mface'),mBub=$('mbubble'),mRe=$('mreact');
  var mName='',mTimer=null,mBusy=0,mLast={};
  function mPick(kind){var a=LINES[kind],i=Math.floor(Math.random()*a.length);if(a.length>1&&i===mLast[kind])i=(i+1)%a.length;mLast[kind]=i;
    var n=studentName();   // sans nom : on retire proprement « , {n} » / « {n} »
    return a[i].replace(/, \{n\}/g,n?', '+n:'').replace(/ \{n\}/g,n?' '+n:'').replace(/\{n\}/g,n).replace(/\{m\}/g,mName);}
  function mascotSay(text,ms){mBub.textContent=text;mBub.classList.add('show');clearTimeout(mTimer);mTimer=setTimeout(function(){mBub.classList.remove('show');},ms||1600);}
  function mascotDo(state,ms){mBody.classList.remove('happy','sad','party','swap','hop','look');if(calm())return;void mBody.offsetWidth;mBody.classList.add(state);
    mBusy=Date.now()+(ms||800);setTimeout(function(){mBody.classList.remove(state);},ms||800);}
  function mascotReact(emoji){if(calm())return;mRe.textContent=emoji;mRe.classList.remove('go');void mRe.offsetWidth;mRe.classList.add('go');}
  function mascot(kind){
    if(mEl.classList.contains('off'))return;
    if(kind==='good'){mascotDo('happy',750);mascotReact(['⭐','💖','✨','👍'][Math.random()*4|0]);mascotSay(mPick('good'),1400);}
    else if(kind==='bad'){mascotDo('sad',700);mascotReact('💦');mascotSay(mPick('bad'),1900);}
    else if(kind==='perfect'){mascotDo('party',1500);mascotReact('🎉');mascotSay(mPick('perfect'),2200);}
    else if(kind==='mixed'){mascotDo('look',1200);mascotSay(mPick('mixed'),2400);}
    else if(kind==='win'){mascotDo('party',1500);mascotReact('👑');mascotSay(mPick('win'),3000);}
    else if(kind==='done'){mascotDo('happy',750);mascotReact('💪');mascotSay(mPick('done'),3000);}
    else if(kind==='greet'){mascotDo('hop',500);mascotSay(mPick('greet'),2400);}
    else if(kind==='tap'){mascotDo('hop',500);snd('tick');mascotSay(mPick('tap'),2200);}
    else if(kind==='swap'){mascotDo('swap',600);mascotSay(mPick('swap'),2000);}
    else if(kind==='listen'){mascotSay(mPick('listen'),1600);}
  }
  function mascotListen(on){mEl.classList.toggle('listening',on&&!calm());if(on)mascot('listen');}
  function applyMascot(){var m=MASCOTS[theme]||MASCOTS.aurore,changed=mName&&m[1]!==mName;mName=m[1];mFace.textContent=m[0];if(changed)mascot('swap');}
  function mascotCalmSync(){mEl.classList.toggle('calm',calm());if(calm())mEl.classList.remove('listening');}
  (function mascotInit(){
    var t=$('mascotToggle');t.checked=localStorage.getItem('mascot_on')!=='0';mEl.classList.toggle('off',!t.checked);
    t.addEventListener('change',function(){localStorage.setItem('mascot_on',this.checked?'1':'0');mEl.classList.toggle('off',!this.checked);if(this.checked){mascot('greet');}});
    $('calm').addEventListener('change',mascotCalmSync);mascotCalmSync();
    mEl.addEventListener('click',function(e){e.stopPropagation();mascot('tap');});
    (function idle(){setTimeout(function(){if(!calm()&&Date.now()>mBusy&&!mEl.classList.contains('listening'))mascotDo(Math.random()<.5?'hop':'look',1200);idle();},7000+Math.random()*7000);})();
    setTimeout(function(){mascot('greet');},1100);
  })();

  /* ---------- réactions aux événements du MOTEUR ---------- */
  var restoring=true;setTimeout(function(){restoring=false;},900);   // platform.js rejoue les sections validées au chargement : silence
  var itemQueue=[];
  document.addEventListener('carnet:item',function(e){if(restoring)return;itemQueue.push(e.detail);});
  document.addEventListener('carnet:section',function(e){
    var d=e.detail;var q=itemQueue.splice(0);if(restoring)return;
    // ✨ une paillette par bonne réponse, en cascade
    q.filter(function(x){return x.ok;}).forEach(function(x,i){setTimeout(function(){var r=x.el.getBoundingClientRect();spark(r.left+r.width/2,r.top+r.height/2);},i*80);});
    var r=d.btn.getBoundingClientRect();
    if(d.perfect){setTimeout(function(){burst(r.left+r.width/2,r.top+r.height/2);},q.length*80);mascot('perfect');}
    else{mascot(d.sc>=d.max/2?'mixed':'bad');}
  });
  document.addEventListener('carnet:submit',function(e){var d=e.detail;itemQueue.length=0;if(restoring)return;
    if(d.win){mega();mascot('win');}else{mascot('done');}});
  document.addEventListener('carnet:reset',function(){itemQueue.length=0;});
  document.addEventListener('carnet:progress',function(e){var el=$('progTxt-inflow');if(el)el.textContent=e.detail.done+' / '+e.detail.total+(e.detail.done===e.detail.total?' ✅ ready!':' ✍️');});

  /* le panneau de platform.js (#platformBar) apparaît en bas : on remonte la mascotte tant qu'il est visible */
  setInterval(function(){var pb=$('platformBar');document.body.classList.toggle('pbar',!!pb&&getComputedStyle(pb).display!=='none');},500);

  /* init */
  applyTheme();applyAva();cascade($('view-carnet'));
})();
