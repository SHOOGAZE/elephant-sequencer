/* ---------- start ---------- */
async function init(){
  let loaded=false;
  try{loaded=await GR.store.load('__auto__')}catch(e){}
  if(!loaded){S.builtin();GR.proj=GR.defaultProject()}
  else if(!GR.proj.ver){const Pj=GR.proj;Pj.ver=2;Pj.fx=GR.fx.defaultFx();Pj.patterns=Pj.patterns.map(()=>GR.newPattern());Pj.tracks.forEach(t=>{for(let i=26;i<=30;i++)t.params[i]=0})}
  try{U.hintOff=localStorage.getItem('elephant-hint')==='1';U.holdSeen=localStorage.getItem('elephant-hold')==='1';const mv=parseFloat(localStorage.getItem('elephant-metvol'));if(mv>=0&&mv<=1)U.metVol=mv}catch(e){}
  buildShell();go('play');syncTransport();histReset();requestAnimationFrame(frame);boot();
  document.addEventListener('pointerup',()=>{if(A.ctx&&A.ctx.state!=='running')A.ctx.resume().catch(()=>{})},true);
  window.addEventListener('beforeunload',()=>{GR.store.put('__auto__').catch(()=>{})});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)GR.store.put('__auto__').catch(()=>{})});
}
(function pwa(){
  try{
    if(hasClaudeDl()||!/^https?:$/.test(location.protocol))return;
    const url='__ICON192__',url512='__ICON512__';
    const m=document.createElement('link');m.rel='manifest';
    m.href=URL.createObjectURL(new Blob([JSON.stringify({name:'ELEPHANT',short_name:'ELEPHANT',start_url:location.pathname,scope:location.pathname.replace(/[^/]*$/,''),display:'standalone',background_color:'#16181a',theme_color:'#16181a',icons:[{src:url,sizes:'192x192',type:'image/png',purpose:'any'},{src:url512,sizes:'512x512',type:'image/png',purpose:'any'}]})],{type:'application/manifest+json'}));
    document.head.append(m);
    if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
  }catch(e){}
})();
const TH={};function thRead(){const cs=getComputedStyle(document.documentElement);TH.sc=cs.getPropertyValue('--sc').trim()||'#dcd8d1';TH.on=cs.getPropertyValue('--sd-on').trim()||'#dcd8d1';TH.cur=cs.getPropertyValue('--sd-cur').trim()||'#fff2d6';TH.b4=cs.getPropertyValue('--sd-b4').trim()||'#5a3a1d';TH.off=cs.getPropertyValue('--sd-off').trim()||'#33261a'}
try{GR.lite=localStorage.getItem('elephant-lite')==='1'}catch(e){}
function setHints(off){document.documentElement.classList.toggle('nohint',off);try{localStorage.setItem('elephant-hints',off?'0':'1')}catch(e){}}
try{if(localStorage.getItem('elephant-hints')==='0')document.documentElement.classList.add('nohint')}catch(e){}
function applyTheme(){document.documentElement.setAttribute('data-theme','dark');const m=document.querySelector('meta[name=theme-color]');if(m)m.content='#0a0a0a';thRead()}
applyTheme();
/* multi-touch: taps on buttons must still count while another finger holds a key, pad or slider */
(()=>{
  const act=new Set(),info=new Map();let sup=null;
  const btn=t=>t&&t.closest?t.closest('button,.chip'):null;
  document.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')return;act.add(e.pointerId);info.set(e.pointerId,{b:btn(e.target),x:e.clientX,y:e.clientY,t:performance.now(),multi:act.size>1})},true);
  const drop=e=>{act.delete(e.pointerId);info.delete(e.pointerId)};
  document.addEventListener('pointercancel',drop,true);
  document.addEventListener('pointerup',e=>{
    if(e.pointerType!=='touch')return;const i=info.get(e.pointerId),multi=i&&(i.multi||act.size>1);drop(e);
    if(!i||!i.b||!multi||i.b.disabled)return;
    if(Math.hypot(e.clientX-i.x,e.clientY-i.y)>14||performance.now()-i.t>700)return;
    if(btn(document.elementFromPoint(e.clientX,e.clientY))!==i.b)return;
    sup={t:performance.now(),x:e.clientX,y:e.clientY};i.b.click();
  },true);
  document.addEventListener('click',e=>{if(!sup||!e.isTrusted)return;const s0=sup;if(performance.now()-s0.t>500){sup=null;return}if(Math.hypot(e.clientX-s0.x,e.clientY-s0.y)<=16){sup=null;e.stopPropagation();e.preventDefault()}},true);
  document.addEventListener('touchmove',e=>{if(e.touches.length>1)e.preventDefault()},{passive:false});
})();
document.addEventListener('gesturestart',e=>e.preventDefault());
document.addEventListener('gesturechange',e=>e.preventDefault());
document.addEventListener('dblclick',e=>e.preventDefault());
/* swipe right from the left edge (or on a sheet card) goes back one level: closes the top sheet or leaves a full screen mode */
function backAction(){
  if(sndSheet){closeSndSheet();return true}
  if(patSheet){closePatSheet();return true}
  if(U.tab==='seq'&&U.seqDr&&isLandPhone()){U.seqDr=false;R.seq();return true}
  if(U.tab==='sound'&&(U.lockOpen||U.lockStep>=0)){U.lockOpen=false;U.lockStep=-1;R.sound();return true}
  return false;
}
let swb=null;
document.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse'||e.isPrimary===false){swb=null;return}
  const tg=e.target&&e.target.closest?e.target:null;
  const onCard=tg&&tg.closest('.psheet .pcard')&&!tg.closest('button,canvas,input,.knob,.hfader,.fader,.cats,.sgrid,.list,.pgrid');
  swb=(e.clientX<=26||onCard)?{x:e.clientX,y:e.clientY,id:e.pointerId}:null;
},true);
document.addEventListener('pointermove',e=>{
  if(!swb||e.pointerId!==swb.id)return;
  const dx=e.clientX-swb.x,dy=e.clientY-swb.y;
  if(Math.abs(dy)>45&&Math.abs(dy)>dx){swb=null;return}
  if(dx>70&&Math.abs(dy)<45){swb=null;if(backAction())vib(8)}
},true);
['pointerup','pointercancel'].forEach(n=>document.addEventListener(n,()=>{swb=null},true));
/* tablets: scale the phone column up (CSS zoom); phones stay at 1 */
function uiZoom(){
  const w=innerWidth,h=innerHeight,sh=Math.min(w,h);let z=1;
  if(w>h&&w>560){z=h>560&&window.CSS&&CSS.supports&&CSS.supports('zoom','1.2')?Math.max(1,Math.min(1.5,Math.round(Math.min(h/700,w/1000)*20)/20)):1;document.documentElement.style.setProperty('--z',z);return z}
  if(sh>=600&&window.CSS&&CSS.supports&&CSS.supports('zoom','1.2')){const s=w>h?Math.min(h/800,1.4):Math.min(w/600,1.8);z=Math.max(1,Math.round(s*20)/20)}
  document.documentElement.style.setProperty('--z',z);return z;
}
uiZoom();addEventListener('resize',uiZoom);addEventListener('resize',()=>{U.scW=0});
let rzT=0;window.addEventListener('resize',()=>{clearTimeout(rzT);rzT=setTimeout(()=>{fsApply();const tl=isTabLand()||fsWant();if(tl!==U.tabL){U.tabL=tl;renderTab();return}if(U.tab==='play'&&U.kb)R.play();else if(U.tab==='sound'&&(isLandPhone()!==U.sndLand))R.sound();else if(U.tab==='seq'&&(isLandPhone()!==!!$('#s-seq.qfs')))R.seq()},150)});
document.documentElement.lang=LANG;
/* the first five cards are the core tour (play, pads, steps, sound, keys); MORE TIPS continues with the rest */
const TOUR=[
  ['play','#btnplay','PLAY starts the song. BPM sets the tempo, PAT A picks the pattern.'],
  ['play','.pads','Tap a pad to play its sound. Hold a pad for MUTE, SOLO, SOUND, SEQ and EDIT.'],
  ['seq','.trigs','The 16 trigs of the selected track. Tap to switch one on, tap a lit trig to edit it, hold for quick parameters. VEL draws velocities.'],
  ['sound','.kgrid','Turn the knobs to shape the sound. Tabs hold the filter, modulation, envelopes and the mix. Drag a MOD source onto a knob.'],
  ['sound','.akeys','Play the sound on the keys. Slide a finger across them to glide between notes.'],
  ['seq','.lenk','LEN sets the length of the selected track, up to 64 steps. Tap the number to add a page of 16. FOLLOW keeps the grid on the playhead.'],
  ['seq','.eucrow','EUCLID spreads hits evenly over the track. ROT shifts them. Use the track length (LEN) for odd meters.'],
  ['seq','.tkeys','Pick a track 1-16. Hold a track number for MUTE and SOLO.'],
  ['smpl','.grabrow','GRAB LAST keeps the last 20 seconds you heard. Tap 1, 2 or 4 BARS to turn them into a new sample. REC MIC records from the microphone, LOAD FILE adds your own sound.'],
  ['fx','.fxtabs','Master effects. Each one has its own ON and OFF.'],
  ['mix','.mix','Faders set the level of each track. M mutes, S solos, SC ducks the track when the kick hits. The master has its own meter and mute.'],
  ['play','#none','Rotate the screen. Landscape gives a wider layout with more controls in view, and on a tablet it splits into two columns.'],
  ['sys','.plate','Your work saves by itself. SAVE FILE makes a backup. TUTORIAL here replays this tour.']],TOUR_CORE=5;
function endTour(mark){
  const c=$('#tour');if(c)c.remove();document.querySelectorAll('.tourhl').forEach(e=>e.classList.remove('tourhl'));U.tour=-1;
  if(mark){try{localStorage.setItem('elephant-tour','1')}catch(e){}go('play')}
}
function startTour(i){
  endTour(false);closePadMenu();U.tour=i||0;document.body.append(h('div',{id:'tour','aria-live':'polite'}));showTour();
}
function showTour(){
  killStepPops();
  const i=U.tour,s=TOUR[i],card=$('#tour');if(!s||!card){endTour(true);return}
  document.querySelectorAll('.tourhl').forEach(e=>e.classList.remove('tourhl'));
  if(s[1]==='.eucrow'&&U.seqTab!=='gen'){U.seqTab='gen';if(U.tab==='seq')R.seq()}
  if(U.tab!==s[0])go(s[0]);
  const el=document.querySelector('#s-'+s[0]+' '+s[1])||document.querySelector(s[1]);
  if(el){el.classList.add('tourhl');try{el.scrollIntoView({block:'center',inline:'nearest'})}catch(e){}}/* a card that points at something low on the page scrolls it into view */
  const r=el?el.getBoundingClientRect():null;card.classList.toggle('top',!!(r&&r.top>innerHeight*.5));
  if(el)requestAnimationFrame(()=>{if(U.tour!==i||!el.isConnected)return;const q=el.getBoundingClientRect();card.classList.toggle('top',q.top>innerHeight*.5)});
  const core=i<TOUR_CORE,last=core?i===TOUR_CORE-1:i===TOUR.length-1;
  card.replaceChildren(h('div',{class:'tn',text:(i+1)+' / '+(core?TOUR_CORE:TOUR.length)}),h('div',{class:'tt',text:s[2]}),
    h('div',{class:'row nw'},h('button',{class:'chip xs',text:'SKIP',onclick:()=>endTour(true)}),h('span',{class:'grow'}),
      i?h('button',{class:'chip xs',text:'BACK',onclick:()=>{U.tour--;showTour()}}):null,
      core&&last?h('button',{class:'chip xs',text:'MORE TIPS',onclick:()=>{U.tour++;showTour()}}):null,
      h('button',{class:'chip xs or on',text:last?'DONE':'NEXT',onclick:()=>{if(last)endTour(true);else{U.tour++;showTour()}}})));
}
function maybeTour(){let d=false;try{d=localStorage.getItem('elephant-tour')==='1'}catch(e){}if(!d)startTour(0)}
function boot(){
  let seen=false;try{seen=sessionStorage.getItem('elephant-boot')==='1'}catch(e){}
  if(seen)return;
  const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tap=h('button',{class:'btap',text:'touch the screen to start · headphones recommended'});
  const el=h('div',{id:'boot'},h('div',{class:'bwm'},h('span',{text:'ELEPHANT','data-t':'ELEPHANT'})),tap);
  document.body.append(el);
  let ready=false,gone=false,timers=[];
  const finish=()=>{timers.forEach(clearTimeout);ready=true;el.classList.add('ready')};
  if(reduce)finish();
  else{
    timers.push(setTimeout(()=>{ready=true;el.classList.add('ready')},700));
  }
  el.addEventListener('pointerdown',()=>{
    if(!ready){finish();return}
    if(gone)return;gone=true;
    try{sessionStorage.setItem('elephant-boot','1')}catch(e){}
    try{
      if(ensureAudio()){
        const c=A.ctx,t=c.currentTime+.02,out=c.createGain();out.gain.value=.5;out.connect(c.destination);
        [196,293.66,392,493.88].forEach((f,i)=>{
          const o=c.createOscillator(),x=c.createGain();o.type=i%2?'sine':'triangle';o.frequency.value=f;
          x.gain.setValueAtTime(0,t+i*.07);x.gain.linearRampToValueAtTime(.07,t+i*.07+.02);x.gain.setTargetAtTime(0,t+i*.07+.05,.28);
          o.connect(x);x.connect(out);o.start(t+i*.07);o.stop(t+i*.07+1.6);
        });
      }
    }catch(e){}
    el.classList.add('out');setTimeout(()=>{el.remove();maybeTour()},650);
  });
}
addEventListener('dragover',e=>{if(U.tab==='smpl'&&e.dataTransfer&&[...e.dataTransfer.types].includes('Files'))e.preventDefault()});
addEventListener('drop',e=>{if(U.tab!=='smpl'||!e.dataTransfer||!e.dataTransfer.files.length)return;e.preventDefault();loadFiles(e.dataTransfer.files)});
