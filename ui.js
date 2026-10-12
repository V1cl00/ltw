// ================= UI =================
if(typeof document!=='undefined'){
// Renderer-Plugin: window.R3D (3d.html) ersetzt den 2D-Canvas-Renderer
const R3=window.R3D||null;window.__ltwTowers=()=>G.p[0].towers.length;window.__ltwG=()=>G;window.__ltwUI=()=>({tab,sel,lastHT});window.__cellXY=(x,y)=>{if(R3)return R3.cellScreen(x,y);const L=lanes[0],r=cv.getBoundingClientRect();return[r.left+(L.ox+(x+.5)*CS)*(r.width/Wc),r.top+(L.oy+(y+.5)*CS)*(r.height/Hc)];};// Test-Hook (nur lesend)
const cv=document.getElementById('cv'),cx=R3?null:cv.getContext('2d'),$=id=>document.getElementById(id);
// ---------- Audio (WebAudio-Synthese) ----------
const AU={ctx:null,on:localStorage.getItem('ltw_mute')!=='1',last:{},buf:{},act:0,tension:0,
 init(){if(!this.ctx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return;this.ctx=new C();this.out=this.ctx.createGain();this.out.connect(this.ctx.destination);
   this.sfxG=this.ctx.createGain();this.sfxG.gain.value=.5;this.sfxG.connect(this.out);this.musG=this.ctx.createGain();this.musG.gain.value=.12;this.musG.connect(this.out);this.applyVol();{const b=this.ctx.createBuffer(1,1,22050),s=this.ctx.createBufferSource();s.buffer=b;s.connect(this.out);s.start(0);}this.duckG=this.ctx.createGain();this.duckG.connect(this.musG);this.load();}
  if(this.ctx.state==='suspended')this.ctx.resume();},
 vol:(()=>{try{return Object.assign({m:.9,mu:.6,s:.8},JSON.parse(localStorage.getItem('ltw_vol')||'{}'));}catch(e){return{m:.9,mu:.6,s:.8};}})(),
 applyVol(){if(!this.out)return;const t=this.ctx.currentTime;this.out.gain.setTargetAtTime(this.on?this.vol.m:0,t,.03);this.sfxG.gain.setTargetAtTime(this.vol.s*.7,t,.03);this.musG.gain.setTargetAtTime(this.vol.mu*(this.newMus?.55:.25),t,.03);},
 setVol(k,v){this.vol[k]=v;localStorage.setItem('ltw_vol',JSON.stringify(this.vol));this.applyVol();},
 toggle(){this.on=!this.on;localStorage.setItem('ltw_mute',this.on?'0':'1');if(this.out)this.applyVol();},
 scene(k){this.sc=k;if(!this.mus||!this.newMus)return;const t=this.ctx.currentTime;for(const[n,g]of Object.entries(this.mus)){const on=n==='music_'+k||(n==='ambient_garden'&&k==='battle');g.gain.cancelScheduledValues(t);g.gain.setTargetAtTime(on?(n==='ambient_garden'?.5:1):0,t,1.2);}},
 tone(f,d,type='square',v=.3,f2,dl=0,dest){const c=this.ctx,t=c.currentTime+dl,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(dest||this.sfxG);o.start(t);o.stop(t+d+.02);},
 noise(d,v=.3,ff=1200){const c=this.ctx,t=c.currentTime,b=c.createBuffer(1,c.sampleRate*d,c.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*(1-i/a.length);
  const s=c.createBufferSource(),fl=c.createBiquadFilter(),g=c.createGain();fl.type='lowpass';fl.frequency.value=ff;g.gain.value=v;s.buffer=b;s.connect(fl);fl.connect(g);g.connect(this.sfxG);s.start(t);},
 // ---- Echte Audiodateien (audio/manifest.json), Synth nur als Fallback ----
  async load(){let man=null,nm=null;try{man=await (await fetch('audio/manifest.json')).json();}catch(e){}try{nm=await (await fetch('assets/audio/audio.json?v=17')).json();}catch(e){}
  const dec=async(k,url)=>{try{const ab=await (await fetch(url)).arrayBuffer();this.buf[k]=await new Promise((ok,no)=>this.ctx.decodeAudioData(ab,ok,no));}catch(e){}};
  const ogg=!!document.createElement('audio').canPlayType('audio/ogg; codecs="vorbis"');
  if(nm&&nm.events){this.ev=nm.events;await Promise.all(Object.entries(nm.events).map(([k,v])=>{const s=v.src.find(u=>ogg?/\.ogg$/.test(u):/\.mp3$/.test(u))||v.src[v.src.length-1];return dec(k,s);}));}
  if(man)await Promise.all(Object.entries(man).filter(([k])=>!/^music/.test(k)||!this.buf.music_battle).map(([k,v])=>dec(k,'audio/'+v.file)));
  if(this.buf.music_menu||this.buf.music_battle){this.newMus=1;this.startMusic2();}else if(this.buf.music_calm||this.buf.music_tension)this.startMusic();else this.music();},
 startMusic2(){const c=this.ctx;this.mus={};for(const k of['music_menu','music_battle','ambient_garden']){if(!this.buf[k])continue;const s=c.createBufferSource(),g=c.createGain();s.buffer=this.buf[k];s.loop=true;g.gain.value=0;s.connect(g);g.connect(this.duckG);s.start();this.mus[k]=g;}this.applyVol();this.scene(this.sc||'menu');},
 startMusic(){const c=this.ctx;this.mus={};for(const k of['music_calm','music_tension']){if(!this.buf[k])continue;const s=c.createBufferSource(),g=c.createGain();s.buffer=this.buf[k];s.loop=true;g.gain.value=k==='music_calm'?1:0;s.connect(g);g.connect(this.duckG);s.start();this.mus[k]=g;}
  this.musG.gain.value=.35;},
 setTension(on){if(!this.mus||this.newMus||on===this.tension)return;this.tension=on;const t=this.ctx.currentTime;
  if(this.mus.music_calm)this.mus.music_calm.gain.setTargetAtTime(on?0:1,t,.8);if(this.mus.music_tension)this.mus.music_tension.gain.setTargetAtTime(on?1:0,t,.8);
  if(!this.mus.music_tension&&this.mus.music_calm)this.mus.music_calm.gain.setTargetAtTime(1,t,.5);},
 duck(sec=1.2,lvl=.25){if(!this.duckG)return;const g=this.duckG.gain,t=this.ctx.currentTime;g.cancelScheduledValues(t);g.setTargetAtTime(lvl,t,.05);g.setTargetAtTime(1,t+sec,.4);},
 play(k,vol=.6,rate=1){const b=this.buf[k];if(!b)return false;const c=this.ctx,s=c.createBufferSource(),g=c.createGain();s.buffer=b;s.playbackRate.value=rate;g.gain.value=vol;s.connect(g);g.connect(this.sfxG);s.start();return s;},
 NEW:{m_bogen:'shot_funkenwerfer',m_kanone:'shot_glocke',m_wacht:'shot_wachfeuer',m_ballista:'shot_lichtspeer',m_kapelle:'shot_esse_pulse',hit:'impact',build:'build',sell:'sell',up:'upgrade',send:'send_unit',coin:'gold',leak:'leak',win:'victory',lose:'defeat',tap:'ui_click',transform:'transform',hero:'hero_move',tick:'wave_tick'},
 FILE:{pfeil:['shot_arrow',.3,1],kanone:['shot_cannon',.4,1],frost:['shot_frost',.3,1],gift:['shot_poison',.3,1],blitz:['shot_lightning',.35,1],hit:['hit',.25],boom:['explosion',.5],kill:['creep_death_pop',.45],
  coin:['coin',.85],leak:['leak_warning',1,0,1.5,.3],steal:['life_steal',1,0,1.5,.2],up:['upgrade',.8,0,.8,.5],send:['send',.6],build:['build',.6],sell:['sell',.7],pulse:['event_start',.5],start:['event_start',.7],
  tap:['ui_tap',.4],no:['ui_tap',.5],win:['victory',1,0,4,.1],lose:['defeat',1,0,4,.1]},
 sfx(n){if(!this.ctx||!this.on)return;const now=performance.now();if(now-(this.last[n]||0)<80)return;this.last[n]=now;
  {const k=this.NEW[n];if(k&&this.buf[k]){const shot=/^shot_/.test(k)||k==='impact';if(shot){if(this.act>=8)return;this.act++;}const e=this.ev&&this.ev[k]||{};const src=this.play(k,(e.volume??.7)*(shot?.75:1),shot?.93+Math.random()*.14:1);if(shot&&src)src.onended=()=>this.act--;else if(shot)this.act--;if(e.type==='jingle')this.duck(2.5,.15);return;}}
  if(typeof TT!=='undefined'&&TT[n]&&!this.FILE[n])n=TT[n].vis||'pfeil';
  const F=this.FILE[n];if(F&&this.buf[F[0]]){const shot=F[2]===1;
   if(shot){if(this.act>=4)return;this.act++;}
   const src=this.play(F[0],F[1],(shot?.92+Math.random()*.16:n==='no'?.7:1));if(shot&&src)src.onended=()=>this.act--;
   if(F[3])this.duck(F[3],F[4]);return;}
  this.synth(n);},
 synth(n){switch(n){case'pfeil':this.tone(900,.06,'triangle',.12,500);break;case'kanone':this.noise(.25,.35,400);this.tone(120,.2,'sine',.3,50);break;
   case'frost':this.tone(1500,.12,'sine',.08,2200);break;case'gift':this.tone(300,.15,'sawtooth',.06,180);break;case'blitz':this.noise(.12,.2,4000);this.tone(1800,.08,'square',.05,400);break;
   case'hit':this.tone(220,.04,'square',.05,150);break;case'boom':this.noise(.3,.3,700);break;case'kill':this.tone(600,.08,'square',.1,1200);break;
   case'coin':this.tone(1320,.06,'square',.06);this.tone(1760,.1,'square',.06,0,.06);break;case'leak':this.tone(200,.35,'sawtooth',.2,70);break;
   case'up':[523,659,784,1046].forEach((f,i)=>this.tone(f,.12,'triangle',.15,0,i*.07));break;case'send':this.tone(330,.12,'square',.1,660);break;
   case'pulse':this.tone(400,.6,'sine',.15,1600);break;case'sell':this.tone(1100,.08,'square',.08);break;case'tap':this.tone(700,.03,'square',.04);break;case'start':this.tone(523,.2,'triangle',.2);this.tone(784,.3,'triangle',.2,0,.15);break;case'build':this.tone(260,.08,'square',.12,180);break;case'no':this.tone(140,.15,'square',.12,100);break;
   case'steal':[880,1175,1568].forEach((f,i)=>this.tone(f,.12,'triangle',.18,0,i*.06));break;case'win':[523,659,784,1046,1318].forEach((f,i)=>this.tone(f,.25,'triangle',.2,0,i*.12));break;case'lose':[392,330,262,196].forEach((f,i)=>this.tone(f,.35,'sawtooth',.12,0,i*.2));break;}},
 music(){const ch=[[57,60,64],[53,57,60],[48,52,55],[55,59,62]],mf=m=>440*Math.pow(2,(m-69)/12);let step=0;
  setInterval(()=>{if(!this.on||!G||G.over||paused||this.ctx.state!=='running')return;const c=ch[Math.floor(step/16)%4],i=step%16;
   if(i%4===0)this.tone(mf(c[0]-12),.4,'triangle',.5,0,0,this.musG);
   if(i%2===0)this.tone(mf(c[(i/2)%3]+12),.16,'sine',.18,0,0,this.musG);
   if(i%8===4)this.tone(mf(c[2]+24),.1,'square',.04,0,0,this.musG);step++;},150);}};
document.addEventListener('pointerdown',()=>AU.init(),{capture:true});for(const ev of['touchend','keydown','click'])document.addEventListener(ev,()=>AU.init(),{capture:true,once:true});
// ---------- Tutorial ----------
const TUT=['<b>🛡 Verteidige deine Insel</b><br>Ängste laufen über deine Bahn nach unten. Jede, die durchkommt, kostet ein Leben ❤.',
 '<b>🏗 Bauen & Labyrinth</b><br>Turm unten wählen, Feld antippen, nochmal tippen = bauen. Baue einen langen Umweg – ganz zumauern geht nicht.',
 '<b>⚔ Senden</b><br>Schicke Ängste zum Gegner: kostet Gold, erhöht aber dein Einkommen alle 10 s.',
 '<b>✦ Schrein & Held</b><br>Am Schrein Elemente aktivieren, Türme antippen zum Aufwerten. Doppeltippen bewegt deinen Helden. Viel Erfolg!'];
let tutI=0,tutPaused=false;const tutN=()=>`<div class="small" style="opacity:.6;margin-top:6px">${tutI+1}/${TUT.length}</div>`;
function tut(show){if(show){tutI=0;tutPaused=paused;paused=true;$('tut').style.display='flex';$('tutT').innerHTML=TUT[0]+tutN();$('tutNext').textContent='Weiter ▶';}else{$('tut').style.display='none';paused=tutPaused;localStorage.setItem('ltw_tut','1');}}
$('tutNext').onclick=()=>{tutI++;if(tutI>=TUT.length)tut(false);else{$('tutT').innerHTML=TUT[tutI]+tutN();$('tutNext').textContent=tutI===TUT.length-1?'Los geht\'s!':'Weiter ▶';}};
$('tutSkip').onclick=()=>tut(false);

let G,sel=null,selT=null,speed=1,paused=false,hover=null,pending=null,last=0,tab='bau',view=0,both=true,CS=28,lanes=[],shake=0;
['gesturestart','dblclick'].forEach(e=>document.addEventListener(e,ev=>ev.preventDefault(),{passive:false}));
document.addEventListener('touchmove',e=>{if(!e.target.closest('#panel,#sheet'))e.preventDefault();},{passive:false});
const HD=26,MH=62;// MH: Goldminen-Streifen unter der Bahnlet Wc=0,Hc=0;
function layout(){if(R3){const cw=$('cwrap');both=false;{const b=$('bot');R3.insetB=getComputedStyle(b).position==='fixed'?b.offsetHeight+12:0;}R3.resize(cw.clientWidth,cw.clientHeight);$('bView').style.display='';return;}const cw=$('cwrap');const w=cw.clientWidth,h=cw.clientHeight,pad=6,gap=14;if(!w||!h)return;
 const csB=Math.min((w-2*pad-gap)/(2*COLS),(h-pad-HD-MH)/ROWS),csO=Math.min((w-2*pad)/COLS,(h-pad-HD-MH)/ROWS);
 both=csB>=20;CS=Math.max(8,Math.floor((both?csB:csO)*10)/10);const W=both?2*COLS*CS+gap+2*pad:COLS*CS+2*pad,H=ROWS*CS+HD+MH+pad,dpr=devicePixelRatio||1;
 Wc=W;Hc=H;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);cv.style.width=W+'px';cv.style.height=H+'px';cx.setTransform(dpr,0,0,dpr,0,0);
 lanes=both?[{ox:pad,oy:HD},{ox:pad+COLS*CS+gap,oy:HD}]:(view===0?[{ox:pad,oy:HD},null]:[null,{ox:pad,oy:HD}]);
 $('bView').style.display=both?'none':'';}
let lt=0;const relayout=()=>{cancelAnimationFrame(lt);lt=requestAnimationFrame(layout);};
if(window.ResizeObserver)new ResizeObserver(relayout).observe($('cwrap'));
if(window.visualViewport)visualViewport.addEventListener('resize',relayout);
addEventListener('orientationchange',()=>setTimeout(layout,250));
addEventListener('resize',layout);
function hint(t,ms){const h=$('hint');clearTimeout(hint.t);if(!t){h.style.display='none';return;}h.textContent=t;h.style.display='block';if(ms)hint.t=setTimeout(()=>h.style.display='none',ms);}
let race=localStorage.getItem('ltw_race')||'menschen',heroMv=0;if(!RACE[race]||RACE[race].locked)race='menschen';if(!RACE[race])race='menschen';
function start(){if(LOC||ONL&&ONL.local){LOC=null;ONL=null;}G=newGame();G.diff=+(localStorage.getItem('ltw_diff')??1);sel=null;selT=null;pending=null;view=0;layout();
 titleScreen();}
function titleScreen(){AU.scene('menu');const o=$('ov');o.classList.add('ttl');o.style.display='flex';o.innerHTML='<div class="tbox"><div class="tsub">⚔ Turmverteidigung ⚔</div><h1 class="ttitle">Line Tower Wars</h1><div class="tline"></div><button class="tbtn" id="tKI"><span class="ti">🛡</span><b>Singleplayer</b><small>Gegen 1–3 KIs – Rasse & Schwierigkeit wählen</small></button><button class="tbtn" id="tON"><span class="ti">🌐</span><b>PvP</b><small>2–4 Spieler – Schnelles Spiel oder mit Code</small></button></div>';
 $('tKI').onclick=()=>{o.classList.remove('ttl');kiMenu();};$('tON').onclick=()=>{o.classList.remove('ttl');onlineMenu();};}
const spN=()=>[2,3,4].includes(+localStorage.getItem('ltw_spn'))?+localStorage.getItem('ltw_spn'):2;
// ===== Singleplayer mit 3–4 Inseln: lokale "Server"-Welt Gw (N Spieler, KI), Ansicht wie Online (eigene Bahn + beobachtete Bahn) =====
let LOC=null;
function startLocal(n,diff,rc){const Gw=newGame(n),RK=Object.keys(RACE);Gw.diff=diff;Gw.started=1;pickRace(Gw.p[0],rc);Gw.p.forEach((p,i)=>{p.ai=i?1:0;if(i)pickRace(p,PLAYABLE()[Math.floor(Math.random()*PLAYABLE().length)]);});
 LOC={Gw,names:['Du'].concat(Gw.p.slice(1).map((p,i)=>'KI '+(i+1)+' · '+RACE[p.race].n)),watch:null,acc:9,out:new Set()};
 ONL={local:1,playing:true,seq:0,inMatch:1,send(m){if(!LOC)return;if(m.t==='cmd')localCommand(LOC.Gw,0,m.c);else if(m.t==='watch')LOC.watch=m.pi;},ws:{close(){}}};
 G=newGame();G.online=1;G.local=1;for(const p of G.p)p.ai=0;locSync(0);G.started=1;sel=null;selT=null;pending=null;view=0;layout();
 document.documentElement.style.setProperty('--rc',RACE[rc].c2);document.documentElement.style.setProperty('--rc2',RACE[rc].c);AU.sfx('start');AU.scene('battle');tab='bau';$('ov').style.display='none';ui();}
function locSync(){const Gw=LOC.Gw,s=NET.serState(Gw,0,LOC.names,LOC.watch);
 for(const e of Gw.ev)if(e.k==='elim'&&!LOC.out.has(e.pi)){LOC.out.add(e.pi);if(e.pi===0)hint(`💀 Ausgeschieden – Platz ${Gw.p[0].place}. Du schaust weiter zu.`,4000);else pop(`💀 ${LOC.names[e.pi]} ist raus (Platz ${Gw.p[e.pi].place})`,'#f99');}
 Gw.ev.length=0;s.over=null;NET.hydrate(G,s,[]);if(selT)selT=G.p[0].towers.find(t=>t.id===selT.id)||null;
 if(Gw.over&&!LOC.done){LOC.done=1;const win=Gw.winner===0;ONL.playing=false;G.over=win?'win':'lose';AU.sfx(win?'win':'lose');AU.scene('menu');$('ov').style.display='flex';
  $('ov').innerHTML=`<div class="box"><h1>${win?'Sieg! 🏆':'Niederlage 💀'}</h1><p>${win?'Letzte Insel im Licht!':'Platz '+(Gw.p[0].place||2)+' von '+Gw.p.length+' – Sieger: '+LOC.names[Gw.winner]}</p><button id="again">Neues Spiel</button></div>`;$('again').onclick=()=>{LOC=null;ONL=null;start();};}}
function kiMenu(){$('ov').style.display='flex';$('ov').innerHTML='<div class="box"><h3>Spieler</h3><div class="rowb" id="npl">'+[2,3,4].map(n=>`<button data-np="${n}" class="${n===spN()?'sel':''}" style="display:inline-block;width:auto;flex:1">${n===2?'1 vs 1':n===3?'3 Inseln':'4 Inseln'}</button>`).join('')+'</div><h3>Schwierigkeit</h3><div class="rowb" id="diffs">'+['Leicht','Normal','Schwer'].map((d,i)=>`<button data-d="${i}" class="${G.diff===i?'sel':''}" style="display:inline-block;width:auto;flex:1">${d}</button>`).join('')+'</div><h3>Rasse</h3><div class="rowb" id="races" style="flex-wrap:wrap">'+Object.entries(RACE).map(([k,R])=>`<button data-r="${k}" ${R.locked?'disabled':''} class="${k===race?'sel':''}" style="display:inline-block;width:auto;flex:1 1 30%;border-color:${R.c};background:linear-gradient(${R.c}55,${R.c}22)"><b style="color:${R.c2}">${R.n}</b><br><span class="small">${R.locked?'🔒 Bald verfügbar':R.hero.n}</span></button>`).join('')+'</div><p class="small" id="rdesc">'+RACE[race].d+'</p><button id="go"><b>▶ Spiel starten</b></button></div>';
 $('ov').querySelectorAll('[data-np]').forEach(b=>b.onclick=()=>{localStorage.setItem('ltw_spn',b.dataset.np);$('ov').querySelectorAll('[data-np]').forEach(x=>x.classList.toggle('sel',x===b));});
 $('ov').querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{G.diff=+b.dataset.d;localStorage.setItem('ltw_diff',G.diff);$('ov').querySelectorAll('[data-d]').forEach(x=>x.classList.toggle('sel',x===b));});
 $('ov').querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{race=b.dataset.r;localStorage.setItem('ltw_race',race);$('ov').querySelectorAll('[data-r]').forEach(x=>x.classList.toggle('sel',x===b));$('rdesc').textContent=RACE[race].d;});
 $('ov').querySelector('.box').insertAdjacentHTML('beforeend','<button id="bBack">◀ Zurück</button>');$('bBack').onclick=titleScreen;$('go').onclick=()=>{$('ov').classList.remove('ttl');if(spN()>2)return startLocal(spN(),G.diff,race);pickRace(G.p[0],race);document.documentElement.style.setProperty('--rc',RACE[race].c2);document.documentElement.style.setProperty('--rc2',RACE[race].c);G.started=1;AU.sfx('start');AU.scene('battle');tab='bau';$('ov').style.display='none';ui();if(!localStorage.getItem('ltw_tut'))tut(true);};}
function elDesc(t){const D=elemDef(t);return D?`<span style="color:${D.c}">${D.ico} ${D.n} Lv${D.lv}</span> <span class="small">${D.d}${D.lv>=5&&D.l5?' + Lv5-Bonus':''}${t.buff?' · ✨ Aura':''}</span>`:'<span class="small">Kein Element – im Schrein freischalten, hier gratis wählen</span>';}
function elemPanel(p,t){const rs=Object.keys(ELEM);return `<div style="flex:1 1 100%;margin-bottom:4px">${elDesc(t)}</div><div class="runes">`+rs.map(e=>{const E=ELEM[e],n=p.runes?.[e]||0,c=n?canSlot(p,t,e):null;
 const lab=!n?'nicht freigeschaltet':!c?'aktiv':'gratis umstellen';
 return `<button data-act="slot" data-e="${e}" ${!c||p.gold<c.cost?'disabled':''}><span class="ico" style="color:${E.c}">${E.ico}</span>${E.n}<span class="small">${lab}</span></button>`;}).join('')+'</div>';}
function schreinPanel(p){const na=activeEls(p).length;return `<div class="small" style="flex:1 1 100%">Aktive Elemente ${na}/2${na>=2?' – aktives Element antippen zum Entfernen/Tauschen':''}</div>`+Object.entries(ELEM).map(([e,E])=>`<button data-act="${p.runes?.[e]>0?'unrune':'rune'}" data-e="${e}" ${p.runes?.[e]>0?'style="outline:2px solid #FFC93C"':p.gold<RUNE_COST||na>=2?'disabled':''}><span class="ico" style="color:${E.c}">${E.ico}</span>${E.n} <b>${p.runes?.[e]>0?'✓ aktiv (entfernen)':''}</b><span class="small"><b style="color:#FFC93C">${RUNE_COST}💰</b> · ${E.role}</span><span class="small">${E.d}</span></button>`).join('')+
 `<div class="small" style="align-self:center;min-width:150px">Element-Türme: ${typeCount(p,'element')}/${TT.element.max}<br>Max. 2 Elemente gleichzeitig aktiv, tauschbar.<br>Turm antippen → gratis auf Element umstellen.<br>Stufe: Turm mit Gold aufwerten</div>`;}
function mDesc(k,l){const s=mStats(k,l);if(k==='blitzmeister')return `${s.targets} Ziele, ${s.dmg} Schaden, alle ${s.rate.toFixed(1)}s${s.camo?', sieht Tarnung':''}`;
 if(k==='frostmeister')return `Puls alle ${s.rate.toFixed(1)}s: −${Math.round(s.slow*100)}% Tempo für ${s.dur}s, ${s.dmg} Schaden`;return `+${s.inc} Einkommen/Tick, +${Math.round(s.kill*100)}% Killgold`;}
let lastP='',lastS='';
const IC=(()=>{const S=(d,f)=>`<svg class="ic" viewBox="0 0 16 16"><g fill="${f||'none'}" stroke="#e2b55a" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round">${d}</g></svg>`;
 return{gold:S('<ellipse cx="8" cy="11" rx="5.5" ry="2.2" fill="#7a5520"/><ellipse cx="8" cy="8.5" rx="5.5" ry="2.2" fill="#b8862e"/><ellipse cx="8" cy="6" rx="5.5" ry="2.2" fill="#f2c45a"/>'),
  inc:S('<path d="M2 13l4-4 3 2 5-6"/><path d="M10 5h4v4"/>'),heart:S('<path d="M8 14S2 10 2 6a3 3 0 0 1 6-1 3 3 0 0 1 6 1c0 4-6 8-6 8z" fill="#c8323e"/>'),
  foe:S('<path d="M8 14S2 10 2 6a3 3 0 0 1 6-1 3 3 0 0 1 6 1c0 4-6 8-6 8z" fill="#5a2a5a"/><path d="M5.5 6.5l2 1.5M10.5 6.5l-2 1.5"/>'),
  sword:S('<path d="M3 13l8-8 2-2v2l-2 2-8 8M4 10l2 2M2 14l1-1"/>'),send:S('<path d="M2 8h10M9 4l4 4-4 4"/>'),
  mine:S('<path d="M3 13l7-7M7 3q5 0 7 5-3-3-7-5z" fill="#7a5520"/>')};})();
function ui(){if(!G)return;const p=G.p[0],o=G.p[1];pvpBar();
 const mine=p.creeps.length,deep=p.creeps.some(c=>c.y>ROWS*.6),theirs=o.creeps.length;
 $('stat').innerHTML=`<span id="hG">${IC.gold}<b class="cG">${Math.floor(p.gold)}</b></span><span id="hI">${IC.inc}<b class="cI">+${p.income}</b><span class="incT"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="#fff3" stroke-width="2.5"/><circle cx="8" cy="8" r="6" fill="none" stroke="#FFC93C" stroke-width="2.5" stroke-dasharray="37.7" stroke-dashoffset="${(37.7*Math.max(0,Math.min(1,G.tick/(G.tickLen||10)))).toFixed(1)}" transform="rotate(-90 8 8)"/></svg> in ${Math.max(0,Math.ceil(G.tick))}s</span></span><span>${IC.heart}<b class="cL">${p.lives}</b></span><span>${IC.foe}<b style="color:#e99">${o.lives}</b></span><span class="${deep?'alarm':''}" title="Gegner auf deiner Bahn">${IC.sword}<b>${mine}</b></span><span title="Deine Kreaturen bei der KI">${IC.send}<b>${theirs}</b></span><span>${IC.mine}<b class="cG">${p.mine.w}</b></span>${G.evt&&G.et<G.evt.end?`<span style="color:#c9f">${EVT[G.evt.k].ico}${Math.ceil(G.evt.end-G.et)}s</span>`:''}`;
 if(pumpG){const e=document.querySelector('#hG');e&&e.classList.add('pump');pumpG=0;}if(glowI){const e=document.querySelector('#hI');e&&e.classList.add('glow');glowI=0;}
 {const e=$('tabMine').querySelector('span');if(e)e.textContent='Mine'+(p.mine.w?' ('+p.mine.w+')':'');else $('tabMine').textContent='⛏ Mine'+(p.mine.w?' ('+p.mine.w+')':'');}
 $('bView').textContent=view===0?`👁${ONL?'Gegner':'KI'} ${theirs}`:`👁Ich ${mine}${deep?'⚠':''}`;$('bView').classList.toggle('alarm',view===1&&deep);
 document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('sel',b.dataset.tab===tab&&!selT));
 let h='',sh='';
 if(selT&&p.towers.includes(selT)){
  if(selT.master){const m=MT[p.master];sh=`<div><b style="color:${m.c}">★ ${m.n}</b> Stufe ${p.mLvl}/5 <span class="small">${mDesc(p.master,p.mLvl)}</span></div><div class="rowb">`+
   (p.mLvl<5?`<button data-act="mup" ${p.gold<m.cost[p.mLvl]?'disabled':''}>Aufwerten (${m.cost[p.mLvl]}💰)<br><span class="small">→ ${mDesc(p.master,p.mLvl+1)}</span></button>`:'<button disabled>Maximal</button>')+`<button data-act="close">✕</button></div>`;}
  else{const T=TT[selT.type],s=tStats(selT);
   sh=`<div class="rowb" style="align-items:center"><b style="color:${T.c};flex:2">${T.ico} ${T.n} <span class="small">Schaden ${Math.round(s.dmg)}${s.dot?' +'+s.dot+'/s Gift':''} · RW ${s.rng.toFixed(1)}${s.camo?' · 👁 Tarnung':''}${s.ap?' · 🛡 Rüstungsbrechend':''}</span></b><button data-act="close">✕</button></div><div class="paths">`+
   (T.wall?'<div class="small">Mauer: blockiert nur den Weg (Labyrinth). Keine Upgrades.</div>':(selT.type==='element'?elemPanel(p,selT):'')+[0,1].filter(pa=>T.up[pa].length).map(pa=>{const lv=selT.up[pa],nx=T.up[pa][lv];return `<div class="path"><div class="tier">${[0,1,2].map(i=>`<div class="pip ${i<lv?'on':''}"></div>`).join('')}</div>`+
    (lv>=T.up[pa].length?`<button disabled>Pfad maximiert</button>`:!canUp(selT,pa)?`<button disabled>Gesperrt<br><span class="small">anderer Pfad auf Stufe 3</span></button>`:
    `<button data-act="up" data-pa="${pa}" ${p.gold<nx.cost?'disabled':''}><b>${nx.n}</b> ${nx.cost}💰<br><span class="small">${nx.d}</span></button>`)+'</div>';}).join(''))+
   `</div><div class="tgt">${TGT.map(g=>`<button data-act="tgt" data-g="${g}" class="${selT.tgt===g?'sel':''}">${TGTN[g]}</button>`).join('')}</div>
   <div class="rowb"><button data-act="sell">Verkaufen +${Math.floor(selT.spent*.75)}💰</button></div>`;}}
 else if(tab==='bau'){h=Object.entries(TT).filter(([k,t])=>t.wall||k==='element'||!p.race&&!t.race||t.race===p.race).map(([k,t])=>`<button data-act="bsel" data-t="${k}" class="${sel===k?'sel':''}" ${p.gold<t.cost||(t.max&&typeCount(p,k)>=t.max)?'disabled':''}><span class="ico" style="color:${t.race?RACE[t.race].c2:t.c}">${t.ico}</span>${t.n}<span class="small">${t.role?'<i>'+t.role+'</i> ':''}${t.max&&!t.cost?'gratis '+wallCount(p)+'/'+t.max:t.cost+'💰'+(t.max?' '+typeCount(p,k)+'/'+t.max:'')}</span></button>`).join('');
  if(p.master&&!p.masterT)h=`<button data-act="bsel" data-t="master" class="${sel==='master'?'sel':''}"><span class="ico" style="color:${MT[p.master].c}">★</span>Meister<span class="small">gratis</span></button>`+h;}
 else if(tab==='send')h=(G.others?`<div class="small" style="align-self:center;display:flex;gap:4px;flex-wrap:wrap;max-width:260px">Ziel: <button data-act="sto" data-i="-1" style="width:auto;${p.sendTo==null?'outline:2px solid #FFC93C':''}">Auto</button>${G.others.filter(q=>q.i!==G.me&&!q.dead).map(q=>`<button data-act="sto" data-i="${q.i}" style="width:auto;${p.sendTo===q.i?'outline:2px solid #FFC93C':''}">${esc(q.name)}${q.i===G.tgt?' 🎯':''}</button>`).join('')}</div>`:'')+CT.filter(c=>ctAvail(p,c)).map(c=>{const lk=G.t<c.unlock,cd=sendCd(G,p,c);return `<button data-act="send" data-c="${c.id}" title="${c.n}: Kosten ${creepCost(G,c)}💰, dein Einkommen +${incGain(p,c)}, Gegner erhält Kopfgeld = Einkommensgewinn${c.d?' · '+c.d:''}" ${lk||cd>0||p.gold<creepCost(G,c)?'disabled':''}><span class="ico" style="color:${c.c}">${c.thief?'💰':c.sabo?'⚙':c.raceUnit?'★':c.fly?'▼':c.camo?'◌':c.armor?'⬢':'●'}</span>${c.n}<span class="small">${lk?'🔒 '+(c.unlock-Math.floor(G.t))+'s':cd>0?'⏳ '+Math.ceil(cd)+'s':(creepCost(G,c)<c.cost?'<s>'+c.cost+'</s> '+creepCost(G,c):'<b style="color:#FFC93C;font-size:1.15em">'+c.cost+'💰</b>')+' +'+incGain(p,c)+'📈'}</span></button>`}).join('');
 else if(tab==='mine'){const M=p.mine,L=MINE[M.lvl],nx=MINE[M.lvl+1];
  h=`<div class="small" style="min-width:120px;align-self:center">⛏ ${M.w} Arbeiter liefern automatisch<br>≈${(L.y*M.w).toFixed(1)}💰/s</div>`+
   `<button data-act="worker" ${M.w>=L.cap||p.gold<workerCost(p)?'disabled':''}><span class="ico">👷</span>Arbeiter ${M.w}/${L.cap}<span class="small">${M.w>=L.cap?'voll':workerCost(p)+'💰 · +'+L.y+'/s'}</span></button>`+
   `<button data-act="mineup" ${!nx||p.gold<nx.cost?'disabled':''}><span class="ico">🏗</span>Mine Stufe ${M.lvl+1}/3<span class="small">${nx?'Ausbau '+nx.cost+'💰 → '+nx.cap+' Arb.'+(nx.auto?', Auto':''):'max'}</span></button>`+
   `<div class="small" style="align-self:center;min-width:110px">Ertrag ${(M.w*L.y).toFixed(1)}💰/s<br>KI: ${G.p[1].mine.w} Arb.</div>`;}
 else if(tab==='held'){const H=p.hero;h=!H?'<div class="small">Kein Held</div>':`<div class="small" style="min-width:110px;align-self:center"><b style="color:${H.c}">🦸 ${H.n}</b> Stufe ${H.lvl}/10<br>XP ${H.lvl>=10?'max':Math.floor(H.xp)+'/'+heroXpNeed(H.lvl)} · ⚔ ${heroStats(H).dmg}</div>`+
  H.ab.map((k,i)=>{const A=ABIL[k],cd=Math.max(0,H.cd[i]-G.t);return `<button data-act="abil" data-i="${i}" ${cd>0?'disabled':''} title="${A.d}"><span class="ico">${A.ico}</span>${A.n}<span class="small">${cd>0?'⏳ '+Math.ceil(cd)+'s':A.d}</span></button>`;}).join('')+
  `<button data-act="hmove" class="${heroMv?'sel':''}"><span class="ico">👣</span>Bewegen<span class="small">${heroMv?'Feld antippen…':'dann Feld tippen'}</span></button>`;}
 else{h=schreinPanel(p);}
 // nur neu rendern wenn sich etwas ändert (stabile Buttons für Touch)
 if(h!==lastP){$('panel').innerHTML=h;lastP=h;}if(sh!==lastS){$('sheet').innerHTML=sh;lastS=sh;}
 $('panel').style.visibility=sh?'hidden':'visible';$('sheet').style.display=sh?'flex':'none';}
function act(e){const b=e.target.closest('[data-act]');if(!b||b.disabled)return;const p=G.p[0],a=b.dataset.act;
 if(a==='sto'){const i=+b.dataset.i;command(G,0,{op:'sendTo',to:i<0?null:i});p.sendTo=i<0?null:i;if(ONL)ONL.send({t:'watch',pi:i<0?null:i});ui();return;}
 if(a==='bsel'){sel=sel===b.dataset.t?null:b.dataset.t;pending=null;hint('');if(sel&&!both&&view)view=0,layout();}
 else if(a==='send'){const ig=command(G,0,{op:'send',creep:b.dataset.c});if(ig){AU.sfx('send');pop('+'+ig+' Einkommen 📈','#fd5');}}
 
 else if(a==='abil'){if(command(G,0,{op:'heroAbility',i:+b.dataset.i})){AU.sfx('up');const A=ABIL[p.hero.ab[+b.dataset.i]];pop(A.ico+' '+A.n,p.hero.c);}}
 else if(a==='hmove'){heroMv=!heroMv;sel=null;pending=null;if(heroMv&&view)view=0,layout();}
 else if(a==='worker'){if(command(G,0,{op:'worker'}))AU.sfx('build');}
 else if(a==='mineup'){if(command(G,0,{op:'mineUp'}))AU.sfx('up');}
 else if(a==='rune'){if(command(G,0,{op:'buyRune',e:b.dataset.e}))AU.sfx('coin');}else if(a==='unrune'){if(command(G,0,{op:'dropRune',e:b.dataset.e}))AU.sfx('tap');}
 else if(a==='slot'){const k=command(G,0,{op:'slotRune',id:selT.id,e:b.dataset.e});if(k){AU.sfx('up');const D=elemDef(selT);pop((k==='fuse'?'Fusion: ':'')+D.ico+' '+D.n+' Lv'+D.lv,D.c);}}
 else if(a==='mup'){if(command(G,0,{op:'masterUp'}))AU.sfx('up');}
 else if(a==='up'){if(command(G,0,{op:'upgrade',id:selT.id,path:+b.dataset.pa}))AU.sfx('up');}
 else if(a==='tgt')command(G,0,{op:'target',id:selT.id,mode:b.dataset.g});
 else if(a==='sell'){command(G,0,{op:'sell',id:selT.id});selT=null;AU.sfx('sell');}
 else if(a==='close')selT=null;ui();}
document.addEventListener('click',e=>{if(e.target.closest('button')&&!e.target.closest('[data-act=send],[data-act=up],[data-act=mup],[data-act=sell]'))AU.sfx('tap');});
$('panel').onclick=act;$('sheet').onclick=act;
$('tabs').onclick=e=>{const b=e.target.closest('button');if(!b)return;tab=b.dataset.tab;selT=null;ui();};
$('bPause').onclick=()=>{if(ONL)return;paused=!paused;$('bPause').textContent=paused?'▶':'⏸';};
$('bSpeed').onclick=()=>{if(ONL)return;speed=speed===1?2:1;$('bSpeed').textContent=speed+'x';};
$('bMute').textContent=AU.on?'🔊':'🔇';$('bMute').onclick=()=>{AU.init();let p=$('sndP');if(p){p.remove();return;}p=document.createElement('div');p.id='sndP';
 p.style.cssText='position:fixed;top:54px;right:8px;z-index:40;padding:12px 14px;border-radius:10px;min-width:220px;background:linear-gradient(180deg,rgba(24,46,40,.97),rgba(9,18,15,.98));border:1px solid #e2b55a;box-shadow:inset 0 0 0 3px rgba(9,18,15,.95),inset 0 0 0 4px rgba(226,181,90,.45),0 10px 30px #0009;color:#efe6cc;font:13px system-ui';
 setTimeout(()=>{const q=document.getElementById('sndP');if(q&&!q.querySelector('#pvReplay')){const b=document.createElement('button');b.id='pvReplay';b.textContent='❔ PvP-Einführung zeigen';b.style.marginTop='8px';b.onclick=()=>{q.remove();pvpTut(1);};b.textContent='❔ PvP-Tipps ansehen';q.appendChild(b);const c=document.createElement('button');c.textContent='📖 Tutorial erneut';c.style.marginTop='6px';c.onclick=()=>{q.remove();if(!ONL||ONL.local)tut(true);else pvpTut(1);};q.appendChild(c);}},0);
 const row=(k,l)=>`<label style="display:flex;align-items:center;gap:8px;margin:8px 0">${l}<input type="range" min="0" max="1" step=".05" value="${AU.vol[k]}" data-k="${k}" style="flex:1;accent-color:#e2b55a;height:28px"></label>`;
 p.innerHTML=`<b style="font-family:var(--serif);color:#fff0b8;letter-spacing:1px">Klang</b>${row('m','Gesamt')}${row('mu','Musik')}${row('s','Effekte')}<button id="sndM" style="width:100%;min-height:40px">${AU.on?'🔇 Stumm schalten':'🔊 Ton an'}</button>`;
 document.body.appendChild(p);p.querySelectorAll('input').forEach(i=>i.oninput=()=>AU.setVol(i.dataset.k,+i.value));
 $('sndM').onclick=()=>{AU.toggle();$('sndM').textContent=AU.on?'🔇 Stumm schalten':'🔊 Ton an';$('bMute').textContent=AU.on?'🔊':'🔇';};};
$('bHelp').onclick=()=>tut(true);
$('bView').onclick=()=>{view=1-view;layout();ui();};
function cpt(e){const r=cv.getBoundingClientRect();return[(e.clientX-r.left)*(Wc/(r.width||1)),(e.clientY-r.top)*(Hc/(r.height||1))];}
function schreinHit(e){if(R3){const h=R3.pick(e.clientX,e.clientY);return !!h&&h.schrein===0;}const[px,py]=cpt(e),L=lanes[0];return !!L&&py>=HD+ROWS*CS&&py<=HD+ROWS*CS+MH&&px>=L.ox+COLS*CS*.74&&px<=L.ox+COLS*CS;}
function mineHit(e){if(schreinHit(e))return false;if(R3){const h=R3.pick(e.clientX,e.clientY);return !!h&&h.mine===0;}const[px,py]=cpt(e),L=lanes[0];return L&&(py<HD&&py>=0&&px>=L.ox+COLS*CS-78&&px<=L.ox+COLS*CS||py>=HD+ROWS*CS&&py<=HD+ROWS*CS+MH&&px>=L.ox&&px<=L.ox+COLS*CS);}
function cellAt(e){if(R3){const h=R3.pick(e.clientX,e.clientY);return h&&h.x!=null?{pi:h.pi,x:h.x,y:h.y}:null;}const[px,py]=cpt(e);
 for(let i=0;i<2;i++){const L=lanes[i];if(!L)continue;const x=Math.floor((px-L.ox)/CS),y=Math.floor((py-L.oy)/CS);if(x>=0&&y>=0&&x<COLS&&y<ROWS)return{pi:i,x,y};}return null;}
cv.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'){const c=cellAt(e);hover=c&&c.pi===0?c:null;}});
cv.addEventListener('pointerleave',()=>hover=null);
cv.addEventListener('contextmenu',e=>{e.preventDefault();sel=null;selT=null;pending=null;hint('');ui();});
addEventListener('keydown',e=>{if(e.key==='Escape'){line=null;dragB=null;sel=null;selT=null;pending=null;hint('');ui();}if(e.key===' '){e.preventDefault();$('bPause').click();}});
let lpT=null,lpDone=false,lpXY=null;
function posAt(e){if(R3){const h=R3.pick(e.clientX,e.clientY);return h&&h.fx!=null?{pi:h.pi,fx:h.fx,fy:h.fy}:null;}const[px,py]=cpt(e);for(let i=0;i<2;i++){const L=lanes[i];if(!L)continue;const fx=(px-L.ox)/CS,fy=(py-L.oy)/CS;if(fx>=0&&fy>=0&&fx<COLS&&fy<ROWS)return{pi:i,fx,fy};}return null;}
let lastHT=null;const esc=s=>String(s).replace(/[<>&"]/g,'');
function goLane(i){if(R3&&R3.goLane)R3.goLane(i);else{view=i;layout();}}
function pvpBar(){let b=$('pvpBar');if(!G||!G.online||!G.others){if(b)b.remove();return;}
 if(!b){b=document.createElement('div');b.id='pvpBar';b.style.cssText='position:fixed;top:44px;left:50%;transform:translateX(-50%);z-index:30;display:flex;gap:4px;font-size:11px;pointer-events:auto';document.body.appendChild(b);
  b.onclick=e=>{const t=e.target.closest('[data-w]');if(!t)return;const i=+t.dataset.w;if(i===G.me){goLane(0);}else{ONL&&ONL.send({t:'watch',pi:i});goLane(1);}AU.sfx('tap');};}
 const h=G.others.map(q=>`<button data-w="${q.i}" style="width:auto;padding:2px 8px;border-radius:999px;background:rgba(0,0,0,${q.i===G.watch&&q.i!==G.me?'.65':'.35'});border:1px solid ${q.i===G.me?'#FFC93C':q.i===G.watch?'#7CF7FF':'#fff3'};color:#fff;opacity:${q.dead?.5:1}">${q.i===G.me?'🏠 Ich':esc(q.name)} ${q.dead?'💀 #'+q.place:'❤'+q.lives}${q.i===G.tgt&&q.i!==G.me?' 🎯':''}</button>`).join('');
 if(b._h!==h){b.innerHTML=h;b._h=h;}}
function heroMark(x,y){for(let j=0;j<14;j++){const a=j/14*6.283;G.fx.push({k:'part',pi:0,x:x+.5+Math.cos(a)*.42,y:y+.5+Math.sin(a)*.42,vx:0,vy:0,t:1.1,c:j%2?'#7CF7FF':'#FFF6E0'});}G.fx.push({k:'part',pi:0,x:x+.5,y:y+.5,vx:0,vy:0,t:1.1,c:'#7CF7FF'});}
function infoAt(e){const q=posAt(e);if(!q)return null;const p=G.p[q.pi];let best=null,bd=.8;for(const c of p.creeps){const d=Math.hypot(c.x-q.fx,c.y-q.fy);if(d<bd){bd=d;best=c;}}
 if(best){const c=best,ct=c.ct;return `<b style="color:${ct.c}">${ct.n}</b><br>LP ${Math.ceil(c.hp)}/${Math.ceil(c.max)} · Tempo ${ct.sp}<br>${c.fly?'✈ Fliegt (ignoriert Labyrinth)<br>':''}${c.camo?'👁 Getarnt – nur Türme mit Tarnungserkennung<br>':''}${c.armor?'🛡 Gepanzert – −60% phys., −30% magisch<br>':''}${ct.heal?'✚ Heilt Nachbarn<br>':''}Kopfgeld ${c.bounty}💰 (= Einkommen des Senders)`;}
 const H=p.hero;if(H&&Math.hypot(q.fx-H.x,q.fy-H.y)<.75){const S=heroStats(H);return `<b style="color:${H.c}">🦸 ${H.n}</b> Stufe ${H.lvl}/10<br>Schaden ${S.dmg} · RW ${S.rng.toFixed(1)}<br>${H.ab.map(k=>ABIL[k].ico+' '+ABIL[k].n+': '+ABIL[k].d).join('<br>')}<br><span class="small">Antippen → Held-Menü, Bewegen</span>`;}
 const t=p.grid[Math.floor(q.fy)][Math.floor(q.fx)];if(!t)return null;
 if(t.master)return `<b style="color:${MT[p.master].c}">★ ${MT[p.master].n}</b> Stufe ${p.mLvl}<br>${MT[p.master].d}<br><span class="small">${mDesc(p.master,p.mLvl)}</span>`;
 const T=TT[t.type],s=tStats(t);if(T.wall)return '<b>Mauer</b><br>Blockiert nur den Weg.';
 return `<b style="color:${T.c}">${T.n}</b> (${t.up[0]}-${t.up[1]})${T.race?' · '+RACE[T.race].n:''}<br>${T.d?T.d+'<br>':''}${(t.offT||0)>G.t?'⚙ Sabotiert!<br>':''}Schaden ${Math.round(s.dmg)} (${{phys:'physisch',magic:'magisch',poison:'Gift'}[s.dt]}) · alle ${s.rate.toFixed(2)}s · RW ${s.rng.toFixed(1)}${s.splash?'<br>Fläche '+s.splash.toFixed(1):''}${s.slow?'<br>Verlangsamt '+Math.round(s.slow*100)+'%':''}${s.dot?'<br>Gift '+s.dot+'/s':''}${s.chain?'<br>Kette '+s.chain:''}<br>${s.camo?'👁 Erkennt Tarnung':'Keine Tarnungserkennung'}${s.ap?' · 🛡 Rüstungsbrechend':''}${s.ground&&!s.air?'<br>Nur Bodenziele':''}<br>Ziel: ${TGTN[t.tgt]}`;}
// ===== Ziehen zum Bauen =====
// Handy: gedrückt halten (300 ms) + ziehen -> Vorschau-Linie; danach Tippen in die Linie baut alle gültigen, Tippen woanders bricht ab.
// PC: Maus drücken + ziehen + loslassen baut sofort. Kein Konflikt: im Baumodus kein Info-Long-Press und kein 3D-Kameraschwenk (Ausnahme 2 Finger / rechte Maus).
let dragB=null,line=null,ptrN=0;
function lineCells(a,b){const out=[];let x=a.x,y=a.y;while(x!==b.x||y!==b.y){if(Math.abs(b.x-x)>=Math.abs(b.y-y))x+=Math.sign(b.x-x);else y+=Math.sign(b.y-y);out.push({x,y});}return out;}
function updLine(){if(!dragB)return;const P=planBuild(G.p[0],sel,dragB.cells.map(c=>[c.x,c.y]));line={cells:P.cells,cost:P.cost,n:P.n,type:sel};
 hint(line.cells.length>1?`${P.n}× ${TT[sel].n} · ${P.cost}💰${P.n<line.cells.length?' ('+(line.cells.length-P.n)+' ungültig)':''}${dragB.touch?' – in Linie tippen zum Bauen':''}`:'');}
function buildLine(){if(!line)return;const ok=line.cells.filter(c=>c.ok).map(c=>[c.x,c.y]);const n=command(G,0,{op:'buildMany',type:line.type,cells:ok});line=null;dragB=null;hint('');
 if(n){AU.sfx('build');if(navigator.vibrate)navigator.vibrate(12);}else AU.sfx('no');ui();}
cv.addEventListener('pointerdown',e=>{ptrN++;if(ptrN>1||e.button===2||e.button===1){dragB=null;if(R3)R3.lockPan=false;return;}
 if(!G||!sel||sel==='master'||!TT[sel])return;const c=cellAt(e);if(!c||c.pi!==0)return;if(line)return;// Bestätigung folgt im pointerup
 const touch=e.pointerType!=='mouse';dragB={cells:[c],touch,active:!touch,x0:e.clientX,y0:e.clientY};if(R3)R3.lockPan=true;
 if(touch)dragB.holdT=setTimeout(()=>{if(dragB){dragB.active=true;if(navigator.vibrate)navigator.vibrate(8);updLine();}},300);});
cv.addEventListener('pointermove',e=>{if(!dragB||ptrN>1)return;if(!dragB.active){if(Math.hypot(e.clientX-dragB.x0,e.clientY-dragB.y0)>10){clearTimeout(dragB.holdT);dragB.active=true;}else return;}
 const c=cellAt(e);if(!c||c.pi!==0)return;const last=dragB.cells[dragB.cells.length-1];if(c.x===last.x&&c.y===last.y)return;
 for(const q of lineCells(last,c))if(!dragB.cells.some(o=>o.x===q.x&&o.y===q.y))dragB.cells.push(q);dragB.moved=1;updLine();});
addEventListener('pointerup',()=>{ptrN=Math.max(0,ptrN-1);});addEventListener('pointercancel',()=>{ptrN=Math.max(0,ptrN-1);});
cv.addEventListener('pointerdown',e=>{lpDone=false;lpXY=[e.clientX,e.clientY];clearTimeout(lpT);lpT=setTimeout(()=>{if(!G)return;if(dragB||line)return;const h=infoAt(e);if(!h)return;lpDone=true;const tp=$('tip');tp.innerHTML=h;tp.style.display='block';
 tp.style.left=Math.min(innerWidth-250,Math.max(4,e.clientX-120))+'px';tp.style.top=Math.max(4,e.clientY-tp.offsetHeight-30)+'px';if(navigator.vibrate)navigator.vibrate(15);},500);});
cv.addEventListener('pointermove',e=>{if(lpXY&&Math.hypot(e.clientX-lpXY[0],e.clientY-lpXY[1])>10)clearTimeout(lpT);});
cv.addEventListener('pointercancel',()=>{clearTimeout(lpT);$('tip').style.display='none';});
if(R3)R3.onLane=v=>{if(view!==v){view=v;ui();}};
cv.addEventListener('pointerup',e=>{clearTimeout(lpT);lpXY=null;if(R3)R3.lockPan=false;if(R3&&R3.consumeDrag()){lpDone=false;dragB=null;return;}
 if(line&&!dragB){const c=cellAt(e);if(c&&c.pi===0&&line.cells.some(q=>q.x===c.x&&q.y===c.y))buildLine();else{line=null;hint('');}return;}
 if(dragB){clearTimeout(dragB.holdT);const d=dragB;if(d.active&&d.moved&&d.cells.length>1){updLine();if(!d.touch){buildLine();return;}dragB=null;return;}dragB=null;line=null;}if(lpDone){lpDone=false;$('tip').style.display='none';return;}if(!G||G.over)return;
 if(heroMv){const c=cellAt(e);if(c&&c.pi===0){command(G,0,{op:'heroMove',x:c.x,y:c.y});AU.sfx('tap');}heroMv=0;ui();return;}
 {const q=posAt(e),H=G.p[0].hero;if(q&&q.pi===0&&H&&Math.hypot(q.fx-H.x,q.fy-H.y)<.75&&!sel){tab='held';selT=null;AU.sfx('tap');ui();return;}}
 if(tab==='held'&&!sel&&G.p[0].hero){const c=cellAt(e);if(c&&c.pi===0&&!G.p[0].grid[c.y][c.x]){const now=performance.now(),L=lastHT;
   if(L&&now-L.t<450&&Math.abs(L.x-c.x)<=1&&Math.abs(L.y-c.y)<=1){lastHT=null;if(command(G,0,{op:'heroMove',x:c.x,y:c.y})){heroMark(c.x,c.y);AU.sfx('hero');}}
   else{lastHT={t:now,x:c.x,y:c.y};if(!localStorage.getItem('ltw_hmh')){localStorage.setItem('ltw_hmh','1');hint('Doppeltippen/-klicken: Held läuft dorthin',1800);}}return;}}if(schreinHit(e)){tab='meister';sel=null;selT=null;AU.sfx('tap');ui();return;}if(mineHit(e)){if(true){tab='mine';sel=null;selT=null;ui();}else{tab='mine';selT=null;}localStorage.setItem('ltw_minehint','1');ui();return;}const c=cellAt(e),p=G.p[0];if(!c||c.pi!==0){selT=null;pending=null;ui();return;}
 const t=p.grid[c.y][c.x];if(t){selT=t;sel=null;pending=null;hint('');ui();return;}
 if(!sel){selT=null;ui();return;}
 const touch=e.pointerType!=='mouse';
 if(touch&&!(pending&&pending.x===c.x&&pending.y===c.y)){pending=c;return;}// nur grüne/rote Feldvorschau, kein Text
 pending=null;const ok=sel==='master'?command(G,0,{op:'placeMaster',x:c.x,y:c.y}):command(G,0,{op:'build',type:sel,x:c.x,y:c.y});
 if(ok){if(navigator.vibrate)navigator.vibrate(10);AU.sfx(sel==='master'?'start':'build');if(sel==='master'){sel=null;hint('');}else hint('');}else{hint(TT[sel]?.max&&wallCount(p)>=TT[sel].max?'Maximal '+TT[sel].max+' Mauern':p.gold<(TT[sel]?.cost||0)?'Nicht genug Gold':'Weg darf nicht blockiert werden!',1200);shake=.2;AU.sfx('no');}ui();});
// ===== 2D-Renderer: zeichnet nur aus getSnapshot() + UI-Zustand =====
let pumpG=0,glowI=0;
const PAL={ground:['#4a4a3c','#46463a'],path:'#7b6a4c',pathEdge:'#5e5038',own:'#4d8fe0',foe:'#e05050'};
function shade(hex,f){const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;const t=f<0?0:255,k=Math.abs(f);r=Math.round(r+(t-r)*k);g=Math.round(g+(t-g)*k);b=Math.round(b+(t-b)*k);return'#'+((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1);}
const MAT=['#8b5a2b','#8f939c','#8f939c','#6f93bd','#6f93bd','#e0b040'];// Holz→Stein→Metall→Gold
const TCOL={pfeil:'#f2c230',kanone:'#ff7a2a',frost:'#7fe0ff',gift:'#9BE33B',blitz:'#FFF35C',mauer:'#7d7f86'};
function ol(){cx.strokeStyle='#120d08';cx.lineWidth=Math.max(1.5,CS/14);cx.lineJoin='round';cx.stroke();}
function poly(pts){cx.beginPath();pts.forEach(([x,y],i)=>i?cx.lineTo(x,y):cx.moveTo(x,y));cx.closePath();}
function shadedRect(x,y,w,h,col){cx.fillStyle=col;cx.beginPath();cx.roundRect?cx.roundRect(x,y,w,h,w*.18):cx.rect(x,y,w,h);cx.fill();ol();
 cx.fillStyle=shade(col,.28);cx.fillRect(x+w*.12,y+h*.1,w*.5,h*.16);cx.fillStyle=shade(col,-.3);cx.fillRect(x+w*.7,y+h*.2,w*.18,h*.68);}
function drawTower(t,px,py,now,S,L){const m=CS/2,cxp=px+m,cyp=py+m;
 // Bau-Plopp 0->1,15->1 (250ms) & Upgrade-Puls
 let sc=1;const ab=now-(t.born||-9),au=now-(t.upT||-9);if(ab<.25)sc=ab<.17?ab/.17*1.15:1.15-(ab-.17)/.08*.15;if(au<.3)sc*=1+.2*Math.sin(au/.3*Math.PI);
 cx.save();cx.translate(cxp,cyp);cx.scale(sc,sc);cx.translate(-cxp,-cyp);
 cx.fillStyle='rgba(0,0,0,.35)';cx.beginPath();cx.ellipse(cxp+CS*.08,cyp+CS*.32,CS*.4,CS*.14,0,0,7);cx.fill();// Schatten
 if(t.master){const M=MT[L.master],lv=L.mLvl,r=CS*(.36+lv*.025);
  cx.strokeStyle=M.c;cx.globalAlpha=.35+.15*Math.sin(now*3);cx.lineWidth=2;cx.beginPath();cx.arc(cxp,cyp,r+3+lv,0,7);cx.stroke();cx.globalAlpha=1;
  shadedRect(px+CS*.14,py+CS*.42,CS*.72,CS*.48,MAT[Math.min(5,lv)]);
  cx.fillStyle=M.c;cx.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2+now*.6,rr=(i%2?.16:.38)*CS;cx.lineTo(cxp+Math.cos(a)*rr,cyp-CS*.08+Math.sin(a)*rr);}cx.closePath();cx.fill();ol();
  cx.fillStyle='#fff';cx.font=`bold ${Math.max(9,CS*.32)|0}px system-ui`;cx.textAlign='center';cx.fillText(lv,cxp,cyp-CS*.0);cx.textAlign='left';cx.restore();return;}
 const ty=t.vis||t.type,RC=t.race?RACE[t.race]:null,lv=t.lv,mat=RC?shade(RC.acc,-.25-.05*Math.min(5,lv)):MAT[Math.min(5,lv)],c=RC?RC.c:TCOL[t.type]||(t.el&&t.el.c)||'#ccc',k=.82+.045*lv,u=CS*k;
 if(t.wall){shadedRect(px+CS*.06,py+CS*.22,CS*.88,CS*.62,'#6d6f74');cx.strokeStyle='#4d4f54';cx.lineWidth=1;cx.beginPath();cx.moveTo(px+CS*.1,py+CS*.53);cx.lineTo(px+CS*.9,py+CS*.53);cx.moveTo(cxp,py+CS*.22);cx.lineTo(cxp,py+CS*.53);cx.stroke();cx.restore();return;}
 // Sockel (Material nach Stufe)
 shadedRect(cxp-u*.42,cyp-u*.05,u*.84,u*.5,mat);
 const a=t.ang??-Math.PI/2;
 if(ty==='pfeil'){// Wachturm: Schaft + großes Dach
  shadedRect(cxp-u*.24,cyp-u*.32,u*.48,u*.4,shade(mat,-.05));
  poly([[cxp-u*.42,cyp-u*.28],[cxp,cyp-u*.66],[cxp+u*.42,cyp-u*.28]]);cx.fillStyle=c;cx.fill();ol();
  poly([[cxp-u*.42,cyp-u*.28],[cxp,cyp-u*.66],[cxp-u*.05,cyp-u*.28]]);cx.fillStyle=shade(c,.3);cx.fill();
  if(t.up[1]>=3||t.up[0]>=3){cx.fillStyle=t.up[1]>=3?'#5aa0ff':'#ff8a3a';poly([[cxp,cyp-u*.66],[cxp,cyp-u*.92],[cxp+u*.28,cyp-u*.82]]);cx.fill();ol();}}
 else if(ty==='kanone'){// Bastion + Rohr
  cx.save();cx.translate(cxp,cyp);cx.rotate(a);cx.fillStyle='#2c2c30';cx.fillRect(0,-u*.1-lv*.4,u*(.5+lv*.03),u*.2+lv*.8);cx.strokeStyle='#120d08';cx.lineWidth=1.5;cx.strokeRect(0,-u*.1-lv*.4,u*(.5+lv*.03),u*.2+lv*.8);cx.restore();
  cx.fillStyle=c;cx.beginPath();cx.arc(cxp,cyp,u*.3,0,7);cx.fill();ol();cx.fillStyle=shade(c,.35);cx.beginPath();cx.arc(cxp-u*.1,cyp-u*.1,u*.11,0,7);cx.fill();}
 else if(ty==='frost'){// Kristallspitze
  const h=u*(.7+lv*.05);poly([[cxp,cyp-h],[cxp+u*.26,cyp-u*.12],[cxp,cyp+u*.12],[cxp-u*.26,cyp-u*.12]]);cx.fillStyle=c;cx.fill();ol();
  poly([[cxp,cyp-h],[cxp,cyp+u*.12],[cxp-u*.26,cyp-u*.12]]);cx.fillStyle='#ffffff';cx.globalAlpha=.55;cx.fill();cx.globalAlpha=1;
  if(lv>=3){poly([[cxp+u*.3,cyp-u*.4],[cxp+u*.4,cyp-u*.12],[cxp+u*.22,cyp-u*.12]]);cx.fillStyle=c;cx.fill();ol();}}
 else if(ty==='gift'){// Kessel mit Blasen
  cx.fillStyle='#3a3a3a';cx.beginPath();cx.arc(cxp,cyp-u*.12,u*.32,0,Math.PI);cx.fill();ol();
  cx.fillStyle=c;cx.beginPath();cx.ellipse(cxp,cyp-u*.12,u*.32,u*.1,0,0,7);cx.fill();ol();
  for(let i=0;i<2+Math.min(3,lv);i++){const ph=(now*1.5+i*.37)%1;cx.fillStyle=shade(c,.3);cx.globalAlpha=1-ph;cx.beginPath();cx.arc(cxp+(i%3-1)*u*.13,cyp-u*.15-ph*u*.5,u*.06,0,7);cx.fill();}cx.globalAlpha=1;}
 else if(ty==='blitz'){// Tesla-Säule + Kugel
  shadedRect(cxp-u*.1,cyp-u*.55,u*.2,u*.6,shade(mat,-.1));
  const fl=.8+.2*Math.sin(now*20+t.id);cx.fillStyle='#9FD8FF';cx.beginPath();cx.arc(cxp,cyp-u*.6,u*(.2+lv*.015),0,7);cx.fill();ol();
  cx.fillStyle=c;cx.globalAlpha=fl;cx.beginPath();cx.arc(cxp,cyp-u*.6,u*.12,0,7);cx.fill();cx.globalAlpha=1;}
 else if(ty==='aura'){// Aura-Schrein: Säule + pulsierende Kuppel in Rassenfarbe
  shadedRect(cxp-u*.22,cyp-u*.4,u*.44,u*.45,shade(mat,-.05));cx.fillStyle=c;cx.beginPath();cx.arc(cxp,cyp-u*.4,u*.26,Math.PI,0);cx.fill();ol();
  cx.strokeStyle=RC?RC.c2:c;cx.globalAlpha=.25+.2*Math.sin(now*3+t.id);cx.lineWidth=2;cx.beginPath();cx.arc(cxp,cyp,CS*(1.2+.3*((now*.7)%1)),0,7);cx.stroke();cx.globalAlpha=1;}
 else if(ty==='eco'){// Schmelze: Ofen + Schornstein + Glut + Rauch
  shadedRect(cxp-u*.34,cyp-u*.36,u*.68,u*.42,c);ol();shadedRect(cxp+u*.1,cyp-u*.72,u*.16,u*.38,'#3a302a');
  cx.fillStyle=RC?RC.c2:'#f80';cx.globalAlpha=.7+.3*Math.sin(now*8);cx.fillRect(cxp-u*.2,cyp-u*.22,u*.24,u*.16);cx.globalAlpha=1;
  for(let i=0;i<3;i++){const ph=(now*.6+i/3)%1;cx.fillStyle='rgba(120,120,120,'+(.5-ph*.5)+')';cx.beginPath();cx.arc(cxp+u*.18+ph*u*.15,cyp-u*.75-ph*u*.5,u*(.07+ph*.08),0,7);cx.fill();}}
 else if(t.type==='element'){// Obelisk + schwebender Runenstein in Elementfarbe (Spezial: zweifarbig), Stufe = Größe + Punkte
  const E=t.el,ec=E?E.c:'#777',el=E?E.lv:0,h=u*(.62+el*.05);
  poly([[cxp-u*.2,cyp+u*.05],[cxp-u*.12,cyp-h*.6],[cxp+u*.12,cyp-h*.6],[cxp+u*.2,cyp+u*.05]]);cx.fillStyle='#4a4458';cx.fill();ol();
  const gy=cyp-h*.75+Math.sin(now*3+t.id)*u*.04,gr=u*(.17+el*.02);
  if(E){cx.shadowColor=ec;cx.shadowBlur=8+el*2;}poly([[cxp,gy-gr*1.4],[cxp+gr,gy],[cxp,gy+gr*1.2],[cxp-gr,gy]]);cx.fillStyle=ec;cx.fill();cx.shadowBlur=0;ol();
  if(E&&!E.base&&E.runes.length>1){poly([[cxp,gy-gr*1.4],[cxp,gy+gr*1.2],[cxp-gr,gy]]);cx.fillStyle=ELEM[E.runes[0]].c;cx.fill();}
  for(let i=0;i<el;i++){cx.fillStyle=ec;cx.beginPath();cx.arc(px+CS*.2+i*CS*.15,py+CS*.92,CS*.06,0,7);cx.fill();cx.strokeStyle='#000';cx.lineWidth=1;cx.stroke();}
  if(E){cx.strokeStyle=ec;cx.globalAlpha=.25+.15*Math.sin(now*3);cx.lineWidth=1.5;cx.beginPath();cx.arc(cxp,cyp,CS*.48,0,7);cx.stroke();cx.globalAlpha=1;}}
 if(RC){// Rassen-Silhouette (art_direction §2)
  const k2=RC.c2,rk=RC.mark;cx.fillStyle=k2;cx.strokeStyle='#120d08';cx.lineWidth=1.2;
  if(rk==='banner'){cx.fillRect(cxp+u*.3,cyp-u*.7,u*.04,u*.42);poly([[cxp+u*.34,cyp-u*.7],[cxp+u*.56,cyp-u*.62],[cxp+u*.34,cyp-u*.54]]);cx.fillStyle=k2;cx.fill();ol();}
  else if(rk==='horns'){for(const sx of[-1,1]){poly([[cxp+sx*u*.42,cyp],[cxp+sx*u*.6,cyp-u*.3],[cxp+sx*u*.3,cyp-u*.05]]);cx.fillStyle=RC.acc;cx.fill();ol();}}
  else if(rk==='eyes'){cx.shadowColor=k2;cx.shadowBlur=6;for(const sx of[-1,1]){cx.fillStyle=k2;cx.beginPath();cx.arc(cxp+sx*u*.12,cyp+u*.18,u*.06,0,7);cx.fill();}cx.shadowBlur=0;}
  else if(rk==='moon'){cx.fillStyle=RC.acc;cx.beginPath();cx.arc(cxp+u*.32,cyp-u*.62,u*.14,0,7);cx.fill();cx.fillStyle=mat;cx.beginPath();cx.arc(cxp+u*.38,cyp-u*.66,u*.12,0,7);cx.fill();}
  else if(rk==='gear'){cx.fillStyle=k2;cx.beginPath();for(let i=0;i<12;i++){const a2=i*Math.PI/6,rr=i%2?u*.1:u*.15;cx.lineTo(cxp-u*.32+Math.cos(a2)*rr,cyp+u*.2+Math.sin(a2)*rr);}cx.closePath();cx.fill();ol();}}
 if(t.off){cx.fillStyle='rgba(20,20,30,.55)';cx.fillRect(px,py,CS,CS);cx.fillStyle='#ff8080';cx.font=`${Math.max(9,CS*.4)|0}px system-ui`;cx.textAlign='center';cx.fillText('⚙',cxp,cyp+CS*.15);cx.textAlign='left';}
 if(t.buff){cx.fillStyle='#a0ffd0';cx.font=`${Math.max(8,CS*.28)|0}px system-ui`;cx.fillText('✨',px+CS*.02,py+CS*.3);}
 // Stufen-Pips (A orange, B blau) + Element-Aura bei Stufe 5 / Pfad 3
 for(let pa=0;pa<2;pa++)for(let i=0;i<t.up[pa];i++){cx.fillStyle=pa?'#5aa0ff':'#ff9a3a';cx.beginPath();cx.arc(px+CS*.14+i*CS*.17,py+CS*(pa?.9:.93)-(pa?0:CS*.0),CS*.07,0,7);cx.fill();cx.strokeStyle='#000';cx.lineWidth=1;cx.stroke();}
 if(lv>=5||t.up[0]>=3||t.up[1]>=3){cx.strokeStyle=c;cx.globalAlpha=.4+.25*Math.sin(now*4);cx.lineWidth=2;cx.beginPath();cx.arc(cxp,cyp,CS*.5,0,7);cx.stroke();cx.globalAlpha=1;}
 if(t.camo){cx.fillStyle='#fff';cx.beginPath();cx.ellipse(px+CS*.84,py+CS*.16,CS*.1,CS*.06,0,0,7);cx.fill();cx.fillStyle='#000';cx.beginPath();cx.arc(px+CS*.84,py+CS*.16,CS*.035,0,7);cx.fill();}
 cx.restore();}
function drawHero(H,X,Y,now,showR){const px=X(H.x),py=Y(H.y),r=CS*.36,bob=H.moving?Math.sin(now*12)*CS*.04:0;
 if(showR){cx.strokeStyle=H.c;cx.globalAlpha=.5;cx.setLineDash([4,4]);cx.lineWidth=1.5;cx.beginPath();cx.arc(px,py,H.rng*CS,0,7);cx.stroke();cx.setLineDash([]);cx.globalAlpha=1;}
 if(Math.hypot(H.tx-H.x,H.ty-H.y)>.1){cx.strokeStyle=H.c;cx.lineWidth=2;cx.beginPath();cx.arc(X(H.tx),Y(H.ty),CS*.2,0,7);cx.stroke();}
 cx.fillStyle='rgba(0,0,0,.35)';cx.beginPath();cx.ellipse(px+r*.2,py+r*.9,r*.9,r*.3,0,0,7);cx.fill();
 const ccol=shade(H.c,-.35);poly([[px-r*.9,py+r*.8],[px,py-r*.4+bob],[px+r*.9,py+r*.8]]);cx.fillStyle=ccol;cx.fill();ol();// Umhang
 cx.fillStyle=H.c;cx.beginPath();cx.arc(px,py-r*.25+bob,r*.62,0,7);cx.fill();ol();
 cx.fillStyle='#f3d9b5';cx.beginPath();cx.arc(px,py-r*.75+bob,r*.34,0,7);cx.fill();ol();
 cx.save();cx.translate(px,py+bob);cx.rotate(H.ang+Math.PI/2);cx.fillStyle='#e8e8f0';cx.fillRect(r*.45,-r*1.1,r*.14,r*1.0);cx.strokeStyle='#120d08';cx.lineWidth=1;cx.strokeRect(r*.45,-r*1.1,r*.14,r*1.0);cx.restore();
 poly([[px-r*.3,py-r*1.05+bob],[px-r*.18,py-r*1.35+bob],[px,py-r*1.12+bob],[px+r*.18,py-r*1.35+bob],[px+r*.3,py-r*1.05+bob]]);cx.fillStyle='#FFC93C';cx.fill();ol();// Krone
 cx.fillStyle='#000c';cx.beginPath();cx.arc(px+r*.75,py+r*.55,r*.36,0,7);cx.fill();cx.fillStyle='#FFC93C';cx.font=`bold ${Math.max(8,r*.6)|0}px system-ui`;cx.textAlign='center';cx.fillText(H.lvl,px+r*.75,py+r*.75);cx.textAlign='left';
 const xp=H.lvl>=10?1:H.xp/H.need;cx.fillStyle='#000a';cx.fillRect(px-r,py+r*1.05,r*2,3);cx.fillStyle='#b48cff';cx.fillRect(px-r,py+r*1.05,r*2*xp,3);}
function drawCreep(c,X,Y,now){const px=X(c.x),py=Y(c.y),r=CS*(c.boss?.42:c.armor?.32:c.type==='flitzer'?.2:.25),hit=now-c.hitT<.07;
 const sq=now-c.hitT<.12?.85:1;
 if(c.fly){cx.fillStyle='rgba(0,0,0,.3)';cx.beginPath();cx.ellipse(px+r*.4,py+r*1.3,r*.8,r*.3,0,0,7);cx.fill();}
 cx.save();cx.translate(px,py);cx.scale(1/sq*(sq<1?1.05:1),sq);cx.globalAlpha=c.camo?.55:1;
 const col=hit?'#ffffff':c.color;cx.fillStyle=col;cx.beginPath();
 if(c.fly){poly([[0,r],[-r*1.3,-r*.5],[-r*.3,-r*.2],[0,-r*.8],[r*.3,-r*.2],[r*1.3,-r*.5]]);}
 else if(c.armor){for(let i=0;i<6;i++){const a=i*Math.PI/3+Math.PI/6;cx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}cx.closePath();}
 else if(c.type==='flitzer'){cx.ellipse(0,0,r*.8,r*1.25,0,0,7);}else cx.arc(0,0,r,0,7);
 cx.fill();if(c.camo)cx.setLineDash([3,2]);ol();cx.setLineDash([]);
 if(!hit){cx.fillStyle=shade(c.color,.35);cx.beginPath();cx.arc(-r*.35,-r*.35,r*.28,0,7);cx.fill();}
 if(c.boss){cx.fillStyle='#ddd';poly([[-r*.6,-r*.6],[-r*.9,-r*1.3],[-r*.3,-r*.8]]);cx.fill();ol();poly([[r*.6,-r*.6],[r*.9,-r*1.3],[r*.3,-r*.8]]);cx.fill();ol();}
 if(c.heal){cx.fillStyle='#fff';cx.fillRect(-r*.12,-r*.45,r*.24,r*.9);cx.fillRect(-r*.45,-r*.12,r*.9,r*.24);}
 // leuchtende Augen (Blick nach unten)
 cx.fillStyle=c.boss?'#ff3b3b':'#ffe45c';cx.shadowColor=cx.fillStyle;cx.shadowBlur=4;cx.beginPath();cx.arc(-r*.3,r*.15,Math.max(1.4,r*.13),0,7);cx.arc(r*.3,r*.15,Math.max(1.4,r*.13),0,7);cx.fill();cx.shadowBlur=0;
 cx.globalAlpha=1;cx.restore();
 // Debuffs als Rand
 if(c.slow){cx.strokeStyle='#9FE8FF';cx.lineWidth=2;cx.beginPath();cx.arc(px,py,r+3,0,7);cx.stroke();}
 if(c.dot){cx.strokeStyle='#9BE33B';cx.lineWidth=2;cx.setLineDash([2,3]);cx.beginPath();cx.arc(px,py,r+5,0,7);cx.stroke();cx.setLineDash([]);}
 if(c.hp<c.max&&!c.boss){const bw=Math.max(16,r*2.4);cx.fillStyle='#000';cx.fillRect(px-bw/2-1,py-r-8,bw+2,5);cx.fillStyle=c.hp/c.max>.5?'#5CE07A':c.hp/c.max>.25?'#FFC93C':'#FF4D5E';cx.fillRect(px-bw/2,py-r-7,bw*Math.max(0,c.hp/c.max),3);}}
// Goldmine-Grafik: Berg mit Stolleneingang, Arbeiter laufen zwischen Stollen und Goldhaufen, Haufen wächst, Stufen-Optik
// Goldmine-Grafik: Berg mit Stolleneingang, Arbeiter tragen Goldsäcke zum Depot (Gutschrift bei Ankunft), Stufen-Optik
function drawMine(x,y,w,h,M,now){cx.save();
 cx.fillStyle='#2b2418';cx.beginPath();cx.roundRect(x,y,w,h,8);cx.fill();cx.strokeStyle='#FFC93C';cx.lineWidth=2;cx.stroke();
 const mx=x+8,mw=Math.min(110,w*.32);cx.fillStyle='#5b5040';cx.beginPath();cx.moveTo(mx,y+h);cx.lineTo(mx+mw*.45,y+4);cx.lineTo(mx+mw*.6,y+12);cx.lineTo(mx+mw,y+h);cx.fill();cx.strokeStyle='#120d08';cx.lineWidth=2;cx.stroke();
 cx.fillStyle='#6e6250';cx.beginPath();cx.moveTo(mx+mw*.45,y+4);cx.lineTo(mx+mw*.6,y+12);cx.lineTo(mx+mw*.5,y+h);cx.fill();
 const ex=mx+mw*.5,ey=y+h,er=h*.36;cx.fillStyle='#0b0805';cx.beginPath();cx.arc(ex,ey,er,Math.PI,0);cx.fill();
 cx.strokeStyle=['#8b5a2b','#9aa0aa','#FFC93C'][M.lvl]||'#8b5a2b';cx.lineWidth=4;cx.beginPath();cx.moveTo(ex-er,ey);cx.lineTo(ex-er,ey-er);cx.lineTo(ex+er,ey-er);cx.lineTo(ex+er,ey);cx.stroke();
 if(M.lvl>=2){cx.fillStyle='#FFE27A';cx.beginPath();cx.arc(ex+er+5,ey-er+4,3+Math.sin(now*6),0,7);cx.fill();}
 // Depot (Kiste mit Gold)
 const dx=x+w*.6;cx.fillStyle='#6b4a2a';cx.fillRect(dx-14,y+h-16,28,14);cx.strokeStyle='#120d08';cx.lineWidth=1.5;cx.strokeRect(dx-14,y+h-16,28,14);cx.fillStyle='#FFC93C';cx.beginPath();cx.ellipse(dx,y+h-16,12,5,0,0,7);cx.fill();
 // Arbeiter: ph 0-.5 mit Sack zum Depot, .5-1 leer zurück
 (M.ph||[]).forEach((ph,i)=>{const tt=ph<.5?ph*2:2-ph*2,wx=ex+er*.3+(dx-18-ex-er*.3)*tt,wy=y+h-9-Math.abs(Math.sin(now*10+i))*2;
  cx.fillStyle='#e8c9a0';cx.beginPath();cx.arc(wx,wy-6,3,0,7);cx.fill();cx.fillStyle=['#4a6fa5','#a54a4a','#4aa55a'][i%3];cx.fillRect(wx-3,wy-3,6,7);cx.strokeStyle='#120d08';cx.lineWidth=1;cx.strokeRect(wx-3,wy-3,6,7);
  if(ph<.5){cx.fillStyle='#FFC93C';cx.beginPath();cx.arc(wx-5,wy-5,3.5,0,7);cx.fill();cx.stroke();}});
 cx.fillStyle='#FFC93C';cx.font='bold 12px system-ui';cx.textAlign='right';cx.fillText(`Goldmine St.${M.lvl+1}`,x+w-8,y+16);cx.font='bold 13px system-ui';cx.fillText(`⛏${M.w}/${M.cap}  ≈${M.gps.toFixed(1)}💰/s`,x+w-8,y+33);
 cx.font='11px system-ui';cx.fillStyle='#c9b48a';cx.fillText(M.w?`+${M.per} pro Lieferung`:'Antippen: Arbeiter kaufen',x+w-8,y+h-6);cx.restore();}
// Schrein: Steinsockel mit schwebender Rune (Farbe wechselt durch die 8 Elemente), Runenzahl
function drawSchrein(x,y,w,h,L,now){cx.save();const ks=Object.keys(ELEM),E=ELEM[ks[Math.floor(now/1.5)%ks.length]],n=Object.values(L.runes||{}).reduce((a,b)=>a+b,0);
 cx.fillStyle='#231a30';cx.beginPath();cx.roundRect(x,y,w,h,8);cx.fill();cx.strokeStyle='#c08bff';cx.lineWidth=2;cx.stroke();
 const mx=x+w/2,by=y+h-6;cx.fillStyle='#6d6f74';cx.beginPath();cx.moveTo(mx-16,by);cx.lineTo(mx-11,by-14);cx.lineTo(mx+11,by-14);cx.lineTo(mx+16,by);cx.fill();cx.strokeStyle='#120d08';cx.lineWidth=1.5;cx.stroke();
 for(const s of[-1,1]){cx.fillStyle='#8f939c';cx.fillRect(mx+s*13-3,by-34,6,22);cx.strokeRect(mx+s*13-3,by-34,6,22);}
 const ry=by-26+Math.sin(now*3)*3;cx.shadowColor=E.c;cx.shadowBlur=12;cx.fillStyle=E.c;cx.beginPath();cx.moveTo(mx,ry-9);cx.lineTo(mx+7,ry);cx.lineTo(mx,ry+9);cx.lineTo(mx-7,ry);cx.closePath();cx.fill();cx.shadowBlur=0;cx.stroke();
 cx.fillStyle='#e0c8ff';cx.font='bold 11px system-ui';cx.textAlign='center';cx.fillText('Schrein',mx,y+12);if(n){cx.fillStyle='#FFC93C';cx.fillText('✦'+n,x+w-12,y+h-4);}cx.restore();}
function draw(){if(R3){{const pv=sel?(pending||hover):null;R3.render(getSnapshot(G),{line:line?line.cells:null,view,sel,selId:selT?selT.id:null,pv,pvOk:pv?canPlace(G.p[0],pv.x,pv.y):false,pvRng:pv?(sel==='master'?(G.p[0].master==='blitzmeister'?mStats('blitzmeister',1).rng:0):TT[sel].b.rng):0,paused});}return;}const S=getSnapshot(G),now=S.t,W=cv.width/(devicePixelRatio||1),H=cv.height/(devicePixelRatio||1);cx.clearRect(0,0,W,H);
 cx.save();if(shake>0)cx.translate((Math.random()-.5)*6,0);
 S.lanes.forEach((L,pi)=>{const Ly=lanes[pi];if(!Ly)return;const{ox,oy}=Ly,X=v=>ox+v*CS,Y=v=>oy+v*CS;
  // Kopfzeile: Titel + Goldmine
  {const M=L.mine,bx=ox+COLS*CS-78;cx.fillStyle='#3a2a12';cx.fillRect(bx,2,78,HD-4);cx.strokeStyle='#FFC93C';cx.lineWidth=1.5;cx.strokeRect(bx+.5,2.5,77,HD-5);cx.fillStyle='#FFC93C';cx.font='bold 12px system-ui';cx.fillText(`⛏${M.w} ${M.gps.toFixed(1)}/s`,bx+4,HD-8);drawMine(ox,HD+ROWS*CS+3,COLS*CS*.73,MH-6,M,now);drawSchrein(ox+COLS*CS*.74,HD+ROWS*CS+3,COLS*CS*.26,MH-6,L,now);}
  cx.fillStyle=pi?'#ffb0a8':'#bcd6ff';cx.font='bold 12px system-ui';cx.fillText(pi?`${ONL?"Gegner":"KI"} · ${L.race?RACE[L.race].n:'?'}${L.mode==='def'?' 🛡':' 💰'}`:'Deine Bahn'+(L.race?' · '+RACE[L.race].n:''),ox,HD-9);
  // Boden gedämpft, Pfad hell
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){cx.fillStyle=PAL.ground[(x+y)&1];cx.fillRect(X(x),Y(y),CS,CS);}
  cx.fillStyle=PAL.path;for(const[x,y]of L.path)cx.fillRect(X(x)+1,Y(y)+1,CS-2,CS-2);
  cx.strokeStyle='rgba(255,240,200,.18)';cx.lineWidth=Math.max(2,CS*.12);cx.lineCap='round';cx.beginPath();L.path.forEach(([x,y],i)=>i?cx.lineTo(X(x+.5),Y(y+.5)):cx.moveTo(X(x+.5),Y(y+.5)));cx.stroke();
  if(pi===1){cx.fillStyle='rgba(255,60,60,.07)';cx.fillRect(ox,oy,COLS*CS,ROWS*CS);}
  cx.strokeStyle=pi?PAL.foe:PAL.own;cx.lineWidth=2;cx.strokeRect(ox-1,oy-1,COLS*CS+2,ROWS*CS+2);
  // Portal & Ziel
  cx.save();cx.translate(X(SPAWN.x+.5),Y(.5));cx.rotate(now*2);cx.strokeStyle='#c08bff';cx.lineWidth=3;cx.beginPath();cx.arc(0,0,CS*.38,0,4.5);cx.stroke();cx.restore();
  cx.fillStyle='#FF4D5E';cx.fillRect(ox,Y(ROWS)-4,COLS*CS,4);
  if(S.evt){const tint={blutmond:'rgba(200,0,0,.10)',frost:'rgba(120,200,255,.10)',goldrausch:'rgba(255,210,60,.08)',turbo:'rgba(255,255,255,.05)',rabatt:'rgba(200,150,255,.06)'}[S.evt.k];if(tint){cx.fillStyle=tint;cx.fillRect(ox,oy,COLS*CS,ROWS*CS);}}
  const ring=(c,r,col)=>{cx.strokeStyle=col;cx.fillStyle=col+'22';cx.lineWidth=1.5;cx.beginPath();cx.arc(X(c.x+.5),Y(c.y+.5),r*CS,0,7);cx.fill();cx.stroke();};
  const pv=pi===0&&sel?(pending||hover):null;
  if(pi===0&&line)for(const q of line.cells){cx.fillStyle=q.ok?'rgba(92,224,122,.5)':'rgba(255,77,94,.55)';cx.fillRect(X(q.x),Y(q.y),CS,CS);cx.strokeStyle=q.ok?'#5CE07A':'#FF4D5E';cx.lineWidth=2;cx.strokeRect(X(q.x)+1,Y(q.y)+1,CS-2,CS-2);}
  if(pv&&!line){const ok=canPlace(G.p[0],pv.x,pv.y);cx.fillStyle=ok?'rgba(92,224,122,.45)':'rgba(255,77,94,.5)';cx.fillRect(X(pv.x),Y(pv.y),CS,CS);
   if(sel!=='master'&&TT[sel].b.rng)ring(pv,TT[sel].b.rng,'#78dcff');else if(sel==='master'&&L.master==='blitzmeister')ring(pv,mStats('blitzmeister',1).rng,'#c8a0ff');}
  // Türme (unter Gegnern), sortiert nach y für Überlappung
  for(const t of [...L.towers].sort((a,b)=>a.y-b.y))drawTower(t,X(t.x),Y(t.y),now,S,L);
  if(pi===0&&selT){const st=L.towers.find(t=>t.id===selT.id);if(st){ring(st,st.rng,'#ffffff');cx.strokeStyle='#fff';cx.lineWidth=2;cx.strokeRect(X(st.x)+1,Y(st.y)+1,CS-2,CS-2);}}
  // Projektile
  for(const pr of L.proj){cx.fillStyle=TCOL[pr.type]||pr.color;cx.beginPath();cx.arc(X(pr.x),Y(pr.y),pr.type==='kanone'?Math.max(3,CS*.15):Math.max(2,CS*.09),0,7);cx.fill();cx.strokeStyle='#000';cx.lineWidth=1;cx.stroke();}
  for(const c of L.creeps)drawCreep(c,X,Y,now);
  for(const c of L.creeps)if(c.raceUnit||c.thief||c.sabo){cx.font=`${Math.max(9,CS*.36)|0}px system-ui`;cx.textAlign='center';cx.fillText(c.thief?'💰':c.sabo?'⚙':'★',X(c.x),Y(c.y)-CS*.38);cx.textAlign='left';}
  if(L.hero)drawHero(L.hero,X,Y,now,L.pi===0&&tab==='held');
  // Boss-HP groß oben
  const boss=L.creeps.find(c=>c.boss);if(boss){cx.fillStyle='#000c';cx.fillRect(ox+4,oy+4,COLS*CS-8,10);cx.fillStyle='#FF4D5E';cx.fillRect(ox+5,oy+5,(COLS*CS-10)*Math.max(0,boss.hp/boss.max),8);cx.fillStyle='#fff';cx.font='bold 9px system-ui';cx.fillText('KOLOSS',ox+8,oy+12);}
  for(const f of L.fx){
   if(f.k==='shot'||f.k==='bolt'){const ax=X(f.a.x),ay=Y(f.a.y),bx=X(f.b.x),by=Y(f.b.y);cx.strokeStyle=f.k==='bolt'?'#FFF35C':f.c;cx.lineWidth=(f.w||1.5)+1;cx.shadowColor='#9FD8FF';cx.shadowBlur=6;cx.beginPath();cx.moveTo(ax,ay);
    for(let i=1;i<4;i++)cx.lineTo(ax+(bx-ax)*i/4+(Math.random()-.5)*8,ay+(by-ay)*i/4+(Math.random()-.5)*8);cx.lineTo(bx,by);cx.stroke();cx.shadowBlur=0;}
   else if(f.k==='boom'){cx.fillStyle=`rgba(255,150,60,${f.t*2})`;cx.beginPath();cx.arc(X(f.x),Y(f.y),f.r*CS*(1-f.t*2),0,7);cx.fill();cx.strokeStyle=`rgba(255,230,150,${f.t*2})`;cx.lineWidth=2;cx.stroke();}
   else if(f.k==='spark'){cx.fillStyle='#fff';cx.beginPath();cx.arc(X(f.x),Y(f.y),6*f.t/.15,0,7);cx.fill();}
   else if(f.k==='part'){cx.fillStyle=f.c;cx.beginPath();cx.arc(X(f.x),Y(f.y),2.5*f.t/.4+1,0,7);cx.fill();}
   else if(f.k==='txt'){cx.globalAlpha=Math.min(1,f.t*2);const big=f.txt>=40;cx.font=`bold ${big?15:11}px system-ui`;cx.lineWidth=3;cx.strokeStyle='#000';cx.strokeText(f.txt,X(f.x),Y(f.y));cx.fillStyle=big?'#FFC93C':f.c;cx.fillText(f.txt,X(f.x),Y(f.y));cx.globalAlpha=1;}
   else if(f.k==='steal'){cx.globalAlpha=Math.min(1,f.t);cx.font='bold 18px system-ui';cx.textAlign='center';cx.lineWidth=3;cx.strokeStyle='#000';cx.strokeText(f.txt,X(f.x),Y(f.y-(1.2-f.t)*2));cx.fillStyle='#FF4D5E';cx.fillText(f.txt,X(f.x),Y(f.y-(1.2-f.t)*2));cx.textAlign='left';cx.globalAlpha=1;}
   else if(f.k==='coin'){cx.globalAlpha=Math.min(1,f.t*2);cx.font='bold 13px system-ui';cx.lineWidth=3;cx.strokeStyle='#000';cx.strokeText(f.txt,X(f.x)-6,Y(f.y));cx.fillStyle='#FFC93C';cx.fillText(f.txt,X(f.x)-6,Y(f.y));cx.globalAlpha=1;}
   else if(f.k==='burst'){const r=f.r*CS*(1.2-f.t),g=cx.createRadialGradient(X(f.x),Y(f.y),0,X(f.x),Y(f.y),r);g.addColorStop(0,`rgba(255,250,225,${Math.min(1,f.t*2)})`);g.addColorStop(.5,`rgba(242,178,51,${f.t})`);g.addColorStop(1,'rgba(62,123,214,0)');cx.fillStyle=g;cx.beginPath();cx.arc(X(f.x),Y(f.y),r,0,7);cx.fill();}
   else if(f.k==='pulse'){cx.fillStyle=f.c==='gold'?`rgba(255,215,90,${f.t*.4})`:`rgba(150,230,255,${f.t*.35})`;cx.fillRect(ox,oy,COLS*CS,ROWS*CS);}}});
 cx.restore();
 // Leak-Vignette (300 ms) über alles
 const lk=S.lanes[0].fx.find(f=>f.k==='leak');if(lk){const g=cx.createRadialGradient(W/2,H/2,Math.min(W,H)*.3,W/2,H/2,Math.max(W,H)*.7);g.addColorStop(0,'rgba(255,0,0,0)');g.addColorStop(1,`rgba(255,40,60,${Math.min(.55,lk.t*1.4)})`);cx.fillStyle=g;cx.fillRect(0,0,W,H);}
 if(!both&&view===1){const L=S.lanes[0],n=L.creeps.length,dp=L.creeps.some(c=>c.y>ROWS*.6);if(n){const fl=dp&&Math.floor(now*3)%2;cx.fillStyle=fl?'#c00':'#000b';cx.fillRect(W-150,HD+4,142,26);cx.fillStyle='#fff';cx.font='bold 13px system-ui';cx.fillText(`⚔ ${n} auf deiner Bahn${dp?' ⚠':''}`,W-144,HD+22);}}
 if(paused){cx.fillStyle='#000a';cx.fillRect(0,0,W,H);cx.fillStyle='#fff';cx.font='bold 32px system-ui';cx.textAlign='center';cx.fillText('PAUSE',W/2,H/2);cx.textAlign='left';}}
// Münze fliegt vom Kill zum Gold-Zähler, Zähler pumpt
let flying=0;function coinFly(L,x,y){if(flying>6)return;if(R3){const q=R3.project(0,x,y);if(!q)return;return flyFrom(q[0],q[1]);}const r=cv.getBoundingClientRect(),Ly=lanes[0];if(!Ly)return;flyFrom(r.left+(Ly.ox+x*CS)*(r.width/Wc),r.top+(Ly.oy+y*CS)*(r.height/Hc));}
function flyFrom(sx,sy){
 const tg=document.querySelector('#hG');if(!tg)return;const tr=tg.getBoundingClientRect();const d=document.createElement('div');d.className='coinfly';d.textContent='🪙';d.style.left=sx+'px';d.style.top=sy+'px';document.body.appendChild(d);flying++;
 requestAnimationFrame(()=>{d.style.transform=`translate(${tr.left-sx}px,${tr.top-sy}px) scale(.7)`;d.style.opacity='.6';});setTimeout(()=>{d.remove();flying--;pumpG=1;const e=document.querySelector('#hG');if(e){e.classList.remove('pump');void e.offsetWidth;e.classList.add('pump');}},560);}
let uiT=0;
function pop(t,c){const d=document.createElement('div');d.textContent=t;d.style.cssText=`position:fixed;left:50%;top:175px;transform:translateX(-50%);color:${c};font:bold 15px system-ui;background:rgba(0,0,0,.4);padding:2px 10px;border-radius:10px;white-space:nowrap;max-width:94vw;pointer-events:none;transition:all 1.2s ease-out;z-index:7;text-shadow:0 2px 4px #000`;document.body.appendChild(d);requestAnimationFrame(()=>{d.style.top='10px';d.style.opacity='0';});setTimeout(()=>d.remove(),1300);}
function banner(h,ms){const b=$('evb');b.innerHTML=h;b.style.display='block';clearTimeout(banner.t);banner.t=setTimeout(()=>b.style.display='none',Math.min(ms,2000));}
function mineGoldFx(g){let sx,sy;if(R3){const q=R3.depot();if(!q)return;[sx,sy]=q;}else{const L=lanes[0];if(!L)return;const r=cv.getBoundingClientRect();sx=r.left+(L.ox+COLS*CS*.6)*(r.width/Wc);sy=r.top+(HD+ROWS*CS+MH-26)*(r.height/Hc);}
 AU.sfx('coin');const d=document.createElement('div');d.textContent='+'+g+' 💰';d.style.cssText=`position:fixed;left:${sx}px;top:${sy}px;transform:translate(-50%,-50%);color:#FFC93C;font:bold 16px system-ui;text-shadow:0 0 3px #000,0 1px 0 #000;pointer-events:none;z-index:50;transition:transform .9s ease-out,opacity .9s`;document.body.appendChild(d);
 requestAnimationFrame(()=>{d.style.transform='translate(-50%,-180%)';d.style.opacity='0';});setTimeout(()=>d.remove(),950);flyFrom(sx,sy);}
function playEv(){if(!G)return;for(const v of G.ev){if(v.k==='thief'){pop(v.pi===0?`💰 Dieb erbeutet +${v.g}`:`💰 Dieb stiehlt −${v.g}`,v.pi===0?'#fd5':'#f88');AU.sfx('coin');continue;}if(v.k==='ability'){AU.sfx('up');if(v.pi===1)pop((ONL?'Gegner: ':'KI: ')+ABIL[v.a].ico+' '+ABIL[v.a].n,'#ffb0a8');continue;}if(v.k==='minegold'){if(v.pi===0)mineGoldFx(v.g);continue;}if(v.k==='announce'){const E=EVT[v.e];AU.sfx('start');banner(`<b>${E.ico} In 5 s: ${E.n}</b><br><span class="small">${E.d}${E.dur?' · '+E.dur+' s':''}</span>`,4800);continue;}if(v.k==='evstart'){const E=EVT[v.e];AU.sfx('start');AU.duck(1.5,.3);banner(`<b>${E.ico} ${E.n}!</b><br><span class="small">${E.d}</span>`,2500);continue;}if(v.pi!==(both?0:view)&&v.k!=='leak')continue;if(v.k==='shot')AU.sfx(v.ty);else if(v.k==='transform'){if(v.pi===0||both)AU.sfx('transform');if(AU.ctx&&AU.on&&!AU.buf.transform){const f=523*Math.pow(2,(Math.max(1,v.chain)-1)*2/12);AU.tone(f,.12,'triangle',.14,f*2);AU.tone(f*1.5,.18,'sine',.08,0,.05);}if(v.pi===0){AU.sfx('coin');coinFly(0,v.x,v.y);if(v.chain>=3)pop('Licht ×'+v.chain+(v.chain>1?' (+'+5*(v.chain-1)+' % Gold)':''),'#F2B233');}}else if(v.k==='lichtsturm'){if(v.pi===0){if(AU.ctx&&AU.on)[523,659,784,1046].forEach((f,i)=>AU.tone(f,.6,'sine',.12,0,i*.03));banner('<b>✨ Lichtsturm!</b><br><span class="small">Viele Ängste wurden zu Licht. Mehr Mut, mehr Gold!</span>',1800);}}else if(v.k==='kill'){AU.sfx('kill');if(v.pi===0){AU.sfx('coin');coinFly(0,v.x,v.y);}}else if(v.k==='tick'){const e=document.querySelector('#hI');if(e){e.classList.remove('glow');void e.offsetWidth;e.classList.add('glow');}}else if(v.k==='leak'){if(v.pi===0){AU.sfx('leak');pop('−'+v.n+' ❤','#f66');}}else if(v.k==='steal'){if(v.pi===0){AU.sfx('steal');pop('+'+v.n+' ❤ gestohlen','#6f8');}}else AU.sfx(v.k);}G.ev.length=0;}
function mineHint(){if(G&&G.t>35&&!G.mh&&!localStorage.getItem('ltw_minehint')){G.mh=1;localStorage.setItem('ltw_minehint','1');banner('<b>⛏ Deine Goldmine</b><br><span class="small">Gelbes Feld oben rechts an deiner Bahn oder Tab „Mine“: Arbeiter kaufen bringt Gold/s – antippen zum Einsammeln!</span>',7000);}}
function tensionCheck(){mineHint();if(!G)return;const p=G.p[0];AU.setTension(!G.over&&(p.creeps.some(c=>c.y>ROWS*.6)||p.lives<=6)?1:0);}
let loopErr=0;function loop(ts){requestAnimationFrame(loop);try{loopBody(ts);}catch(e){if(loopErr++<5)console.error(e);}}
function loopBody(ts){tensionCheck();const dt=Math.min(.05,(ts-last)/1000||0);last=ts;shake=Math.max(0,shake-dt);
 if(ONL&&G&&G.started&&!G.over){step(G,dt);if(G.over&&!ONL.over)G.over=null;uiT-=dt;if(uiT<=0){uiT=.25;ui();}playEv();}
 else if(G&&!paused&&G.started&&!G.over){if(LOC&&!LOC.done){for(let i=0;i<speed;i++)step(LOC.Gw,dt);LOC.acc+=dt*speed;if(LOC.acc>=.1){LOC.acc=0;locSync();}}for(let i=0;i<speed;i++)step(G,dt);if(LOC&&!LOC.done)G.over=null;uiT-=dt;if(uiT<=0){uiT=.25;ui();}
  playEv();if(G.over&&!G.online){AU.sfx(G.over);$('ov').style.display='flex';$('ov').innerHTML=`<div class="box"><h1>${G.over==='win'?'Sieg! 🏆':'Niederlage 💀'}</h1><p>${G.over==='win'?'Die KI hat alle Leben verloren.':'Du hast alle Leben verloren.'}</p><button id="again">Neues Spiel</button></div>`;$('again').onclick=start;}}
 if(G)draw();}
// ===== Online-PvP (server-autoritativ): Eingaben -> Server, Server-Zustand -> hydrate(G) =====
const LTW_SERVER=new URLSearchParams(location.search).get('server')||window.LTW_SERVER||'https://ltw-server.onrender.com';
let ONL=null;const localCommand=command;
command=function(G_,pi,c){if(ONL&&ONL.playing&&pi===0){ONL.send({t:'cmd',seq:++ONL.seq,c});}return localCommand(G_,pi,c);};// lokale Vorhersage, nächster Snapshot korrigiert
function onlineBtn(){const bx=$('ov').querySelector('.box');if(!bx||$('bOnline'))return;const b=document.createElement('button');b.id='bOnline';b.textContent='🌐 Online (2–4 Spieler)';b.style.marginTop='8px';b.onclick=onlineMenu;bx.appendChild(b);}
const ERRN={room_not_found:'Raum nicht gefunden',room_full:'Raum ist voll',rate_limit_kick:'Zu viele Aktionen – getrennt'};
const PVT=['🏗️ <b>Bauen & Labyrinth:</b> Türme blockieren Wege – baue ein langes Labyrinth auf deiner Insel.','💰 <b>Senden:</b> Kreaturen zum Gegner schicken erhöht dein Einkommen.','⛩️ <b>Schrein:</b> Elemente am Schrein stärken deine Türme.','👆👆 <b>Held:</b> Doppeltippen/-klicken bewegt deinen Helden.','👁️ <b>Zuschauen:</b> Über die Leiste oben siehst du die Inseln der Gegner.'];
function pvpTut(force,done){if(!force&&localStorage.getItem('ltw_pvptut'))return;localStorage.setItem('ltw_pvptut','1');let d=document.getElementById('pvpTut');if(d)d.remove();d=document.createElement('div');d.id='pvpTut';let i=0;
 d.style.cssText='position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:45;max-width:min(92vw,420px);padding:10px 14px;border-radius:10px;background:rgba(9,18,15,.94);border:1px solid #e2b55a;color:#efe6cc;font:14px system-ui;display:flex;gap:10px;align-items:center';
 const r=()=>{d.innerHTML=`<span style="flex:1">${PVT[i]} <span style="opacity:.6">(${i+1}/${PVT.length})</span></span><button id="pvN" style="width:auto;padding:6px 10px">${i<PVT.length-1?'Weiter':'OK'}</button><button id="pvX" style="width:auto;padding:6px 10px">✕</button>`;const fin=()=>{d.remove();done&&done();};d.querySelector('#pvN').onclick=()=>{if(++i>=PVT.length)fin();else r();};d.querySelector('#pvX').onclick=fin;};r();document.body.appendChild(d);}
let PZ={t:null};
function pzBan(html){let b=document.getElementById('pzBan');if(!html){b&&b.remove();return;}if(!b){b=document.createElement('div');b.id='pzBan';b.style.cssText='position:fixed;left:50%;top:30%;transform:translateX(-50%);z-index:44;padding:12px 18px;border-radius:10px;background:rgba(9,18,15,.94);border:1px solid #e2b55a;color:#efe6cc;font:16px system-ui;text-align:center';document.body.appendChild(b);}b.innerHTML=html;}
function pzMsg(m){clearInterval(PZ.t);
 if(m.t==='tutOffer'){let left=m.left;const r=()=>{if(left<=0){clearInterval(PZ.t);pzBan();return;}pzBan(`<button id="pzT" style="width:auto;padding:8px 16px">❔ Tutorial</button><div class="small" style="margin-top:6px">Pausiert das Spiel für alle (${left}s)</div>`);document.getElementById('pzT').onclick=()=>{clearInterval(PZ.t);PZ.mine=1;ONL.send({t:'tutStart'});pzBan();};left--;};r();PZ.t=setInterval(r,1000);}
 else if(m.t==='pause'){const end=Date.now()+m.max*1000;let left;if(PZ.mine){PZ.mine=0;const tick=()=>{left=Math.ceil((end-Date.now())/1000);pzBan(`<span class="small">Pause – noch ${left}s</span>`);const b=document.getElementById('pzBan');b.style.top='8px';};tick();PZ.t=setInterval(tick,1000);pvpTut(1,()=>ONL.send({t:'tutDone'}));}else{const tick=()=>{left=Math.max(0,Math.ceil((end-Date.now())/1000));pzBan(`<b>${m.name||'Spieler '+(m.pi+1)}</b> schaut das Tutorial – Pause<br><span class="small">noch ${left}s</span>`);};tick();PZ.t=setInterval(tick,1000);}}
 else if(m.t==='resume'){const d=document.getElementById('pvpTut');d&&d.remove();let n=m.in;const r=()=>{if(n<=0){clearInterval(PZ.t);pzBan();return;}pzBan(`<b style="font-size:40px">${n--}</b>`);};r();PZ.t=setInterval(r,1000);}}
window.__pz=pzMsg;
function onlineMenu(msg){$('ov').style.display='flex';$('ov').innerHTML=`<div class="box"><h3>🌐 Online PvP</h3><p class="small" id="onSt">${msg||'Server: '+LTW_SERVER}</p>
 <div class="rowb" id="onN" style="gap:6px">Spieler: ${[2,3,4].map(n=>`<button data-n="${n}" class="${n===netSize()?'sel':''}" style="width:auto;flex:1">${n}</button>`).join('')}</div>
 <button id="onQ">⚡ Schnelles Spiel</button><button id="onC">➕ Raum erstellen</button>
 <div class="rowb"><input id="onCode" maxlength="5" placeholder="CODE" style="flex:1;text-transform:uppercase;font:bold 18px monospace;padding:6px;letter-spacing:3px"><button id="onJ" style="width:auto">Beitreten</button></div>
 <button id="onB">◀ Zurück</button></div>`;
 $('onN').querySelectorAll('[data-n]').forEach(b=>b.onclick=()=>{localStorage.setItem('ltw_pvpn',b.dataset.n);$('onN').querySelectorAll('[data-n]').forEach(x=>x.classList.toggle('sel',x===b));});
 $('onQ').onclick=()=>netGo({t:'queue',size:netSize()},'Suche Gegner… (Server startet ggf. ~30 s)');$('onC').onclick=()=>netGo({t:'create',size:netSize()},'Erstelle Raum…');
 $('onJ').onclick=()=>{const c=$('onCode').value.trim().toUpperCase();if(c.length===5)netGo({t:'join',code:c},'Trete bei…');};
 $('onB').onclick=()=>{netClose();titleScreen();};}
const netSize=()=>[2,3,4].includes(+localStorage.getItem('ltw_pvpn'))?+localStorage.getItem('ltw_pvpn'):2;
function netStatus(t,cancel){$('ov').style.display='flex';$('ov').innerHTML=`<div class="box"><h3>🌐 Online</h3><p id="onSt">${t}</p>${cancel?'<button id="onX">Abbrechen</button>':''}</div>`;if(cancel)$('onX').onclick=()=>{netClose();onlineMenu();};}
function netClose(){if(ONL){ONL.closing=1;try{ONL.send({t:'leave'});ONL.ws.close();}catch(e){}clearTimeout(ONL.rt);}ONL=null;}
function netGo(first,txt){netClose();netStatus(txt,1);netConnect(first);}
function netConnect(first){const url=LTW_SERVER.replace(/^http/,'ws'),ws=new WebSocket(url),o=ONL||{seq:0,tries:0};ONL=o;o.ws=ws;o.first=first;
 o.send=m=>{if(ws.readyState===1)ws.send(JSON.stringify(m));};
 ws.onopen=()=>{o.tries=0;ws.send(JSON.stringify({t:'hello',token:o.token,name:localStorage.getItem('ltw_name')||'Spieler'}));};
 ws.onmessage=e=>{if(ONL!==o)return;netMsg(o,JSON.parse(e.data));};
 ws.onclose=()=>{if(ONL!==o||o.closing)return;o.playing=false;if(o.inMatch&&!o.over&&o.tries<15){o.tries++;hint('Verbindung verloren – verbinde neu…');o.rt=setTimeout(()=>netConnect(null),1000*Math.min(4,o.tries));}else if(!o.over)onlineMenu('Verbindung getrennt.');};}
function netMsg(o,m){switch(m.t){
 case'welcome':o.token=m.token;if(o.first&&!m.resumed)o.send(o.first);o.first=null;if(m.resumed)hint('Wieder verbunden',1500);break;
 case'queued':netStatus(`Suche Gegner… ${m.size?`(${m.have||1}/${m.size} Spieler)`:''}`,1);break;
 case'room':o.room=m;case'lobby':{const L=m.t==='lobby'?m:{code:m.code,size:m.size||2,have:1,names:[]};netStatus(`Raum-Code (${L.size} Spieler):<br><b style="font:bold 34px monospace;letter-spacing:6px">${L.code}</b><br><span class="small">Code an Freunde schicken – ${L.have}/${L.size} da${L.names.length?': '+L.names.filter(n=>n!=='—').map(esc).join(', '):''}. Start, sobald voll.</span>`,1);break;}
 case'eliminated':hint(`💀 Ausgeschieden – Platz ${m.place}. Du kannst weiter zuschauen.`,4000);break;
 case'playerOut':if(m.pi!==o.pi)pop(`💀 ${esc(m.name||'Spieler')} ist raus (Platz ${m.place})`,'#f99');break;
 case'error':if(o.inMatch)hint(ERRN[m.msg]||m.msg,2000);else onlineMenu('⚠ '+(ERRN[m.msg]||m.msg));break;
 case'match':o.inMatch=1;o.over=0;o.pi=m.you;o.code=m.code;if(!G||!G.online||m.phase==='pick'){G=newGame();G.online=1;for(const p of G.p)p.ai=0;sel=null;selT=null;pending=null;view=0;layout();}
  if(m.phase==='pick')netPick(o,m);else{G.started=1;o.playing=true;AU.scene('battle');$('ov').style.display='none';}break;
 case'raceOk':{const b=$('go');if(b){b.disabled=true;b.textContent='Warte auf Gegner…';}break;}
 case'phase':if(m.phase==='play'){G.started=1;o.playing=true;AU.scene('battle');tab='bau';$('ov').style.display='none';AU.sfx('start');ui();}break;
 case'state':if(!G)break;NET.hydrate(G,m.s,m.ev);if(selT)selT=G.p[0].towers.find(t=>t.id===selT.id)||null;
  if(G.p[0].race){document.documentElement.style.setProperty('--rc',RACE[G.p[0].race].c2);document.documentElement.style.setProperty('--rc2',RACE[G.p[0].race].c);}break;
 case'ack':if(!m.ok&&m.err!=='rate_limited')hint('✖ '+m.err,1200);break;
 case'oppDisconnected':hint(`Gegner getrennt – Spiel pausiert (max. ${m.left} s)`,m.left*1000);break;
 case'oppReconnected':hint('Gegner wieder da',1500);break;
 case'tutOffer':case'pause':case'resume':pzMsg(m);break;
case'oppLeft':hint('Gegner hat den Raum verlassen',3000);{const b=$('onR');if(b)b.disabled=true;}break;
 case'rematchReq':{const b=$('onR');if(b&&!b.disabled)b.textContent=`🔁 Revanche annehmen${m.size>2?` (${m.have}/${m.size})`:''}`;break;}
 case'over':{o.over=1;o.playing=false;G.over=m.result;AU.sfx(m.result);const why=(m.size>2?` – Platz ${m.place} von ${m.size}${m.result==='win'?'':', Sieger: '+esc(m.winnerName)}`:'')+({lives:'',forfeit_disconnect:' (Gegner nicht zurückgekehrt)',forfeit_left:' (Aufgabe)'}[m.reason]||'');
  $('ov').style.display='flex';$('ov').innerHTML=`<div class="box"><h1>${m.result==='win'?'Sieg! 🏆':'Niederlage 💀'}</h1><p>${(m.result==='win'?(m.size>2?'Letzter Überlebender!':'Gegner hat verloren'):'Du hast verloren')+why}</p><button id="onR">🔁 Revanche</button><button id="onM">Online-Menü</button><button id="onE">Hauptmenü</button></div>`;
  $('onR').onclick=()=>{o.send({t:'rematch'});$('onR').disabled=true;$('onR').textContent='Warte auf Gegner…';};$('onM').onclick=()=>{netClose();onlineMenu();};$('onE').onclick=()=>{netClose();start();};break;}}}
function netPick(o,m){$('ov').style.display='flex';$('ov').innerHTML='<div class="box"><h3>Gegner: '+String(m.opp).replace(/[<>&]/g,'')+'</h3><h3>Rasse wählen <span id="pkT"></span></h3><div class="rowb" style="flex-wrap:wrap">'+Object.entries(RACE).map(([k,R])=>`<button data-r="${k}" ${R.locked?'disabled':''} class="${k===race?'sel':''}" style="display:inline-block;width:auto;flex:1 1 30%;border-color:${R.c};background:linear-gradient(${R.c}55,${R.c}22)"><b style="color:${R.c2}">${R.n}</b><br><span class="small">${R.locked?'🔒 Bald verfügbar':R.hero.n}</span></button>`).join('')+'</div><p class="small" id="rdesc">'+RACE[race].d+'</p><button id="go">Bereit</button></div>';
 $('ov').querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{race=b.dataset.r;localStorage.setItem('ltw_race',race);$('ov').querySelectorAll('[data-r]').forEach(x=>x.classList.toggle('sel',x===b));$('rdesc').textContent=RACE[race].d;});
 $('go').onclick=()=>o.send({t:'race',race});const end=Date.now()+m.pickLeft*1000;const iv=setInterval(()=>{const e=$('pkT');if(!e)return clearInterval(iv);e.textContent='('+Math.max(0,Math.ceil((end-Date.now())/1000))+' s)';},250);}
window.LTW_ONLINE={get state(){return ONL;},menu:onlineMenu};
start();ui();requestAnimationFrame(loop);}
