/* ---------- coach: a short tip the first time each page opens, worded for touch or mouse and keyboard ---------- */
const COACH={
  play:['Tap a pad to play it, hold it for MUTE, SOLO and VOL. Press PLAY to hear your pattern.','Click a pad or press its key (` switches NOTES / PADS). Hold a pad for MUTE, SOLO and VOL. SPACE plays and stops.'],
  seq:['Tap a step to switch it on. Every row is a track, hold its number for MUTE and SOLO. Hold a step for quick edits: swipe up or down for the value, left or right for the function.','Click a step to switch it on. Every row is a track, hold the mouse on its number for MUTE and SOLO. Hold the mouse button on a step for quick edits: drag up or down for the value, left or right for the function.'],
  sound:['Drag a knob to change it, double tap resets it. The tabs along the top hold the other controls. Play the keys below, HOLD keeps notes ringing.','Drag a knob up or down, double click resets it. Play the keys with A W S E D F T G Y H U J K O L P, Z / X change the octave.'],
  fx:['Master effects: each has its own ON and OFF. Small amounts sound best, start with reverb and delay.'],
  mix:["Faders set each track's level. M mutes, S solos, SC ducks the track when the kick hits."],
  smpl:['Tap LOAD FILE to add your own sound, REC MIC to record one, or GRAB LAST to keep what you just heard. Trim the wave, then ASSIGN it to a track.'],
  sys:['Your work saves by itself. SAVE FILE makes a backup, STARTER PRESETS load a ready-made groove.']};
const coachSeen=()=>{try{const v=localStorage.getItem('elephant-coach');return v==='all'?'all':JSON.parse(v||'{}')}catch(e){return{}}};
function coachShow(tab){
  const old=document.querySelector('.coach');if(old)old.remove();
  const tips=COACH[tab],root=$('#s-'+tab);if(!tips||!root||U.tour>=0||isLandPhone())return;
  const seen=coachSeen();if(seen==='all'||seen[tab]||document.documentElement.classList.contains('nohint'))return;
  const pc=matchMedia('(hover:hover) and (pointer:fine)').matches,txt=tips[pc&&tips[1]?1:0];
  const done=()=>{const c=coachSeen();const o=c==='all'?{}:c;o[tab]=1;try{localStorage.setItem('elephant-coach',JSON.stringify(o))}catch(e){}card.remove()};
  const card=h('div',{class:'coach',role:'note'},h('b',{text:'TIP'}),h('span',{text:txt}),h('button',{class:'chip xs or',text:'GOT IT',onclick:done}));
  root.prepend(card);
}
Object.keys(R).forEach(k=>{const o=R[k];R[k]=function(){const r=o.apply(this,arguments);coachShow(k);return r}});
/* a re-render (tapping a step, switching a sub tab) keeps the scroll position, and each page remembers its own when you come back to it */
function keepScroll(){Object.keys(R).forEach(k=>{const f=R[k];if(f._ks)return;const w=function(){const s=document.getElementById('s-'+k),y=s?s.scrollTop:0,r=f.apply(this,arguments);if(s&&y){s.scrollTop=y;requestAnimationFrame(()=>{s.scrollTop=y})}return r};w._ks=1;R[k]=w})}
keepScroll();
window.GRUI={U,A,go,setUi,init,playToggle,renderTab,R,trk,curPat};
init();
