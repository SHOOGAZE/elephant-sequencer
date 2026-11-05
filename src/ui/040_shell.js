/* ---------- shell ---------- */
const TABS=[['play','PADS'],['seq','SEQ'],['sound','SAMPLE'],['mix','MIX'],['fx','FX'],['smpl','WAVE'],['sys','SYS']];
let btnPlay,btnRec,btnFill,btnMet,bpmNum,scope,sc2,anBuf;
function buildShell(){
  const app=$('#app');app.replaceChildren();
  btnPlay=h('button',{class:'btn',id:'btnplay',text:'PLAY',onclick:playToggle});
  btnRec=h('button',{class:'btn',text:'REC',onclick:()=>{A.rec=!A.rec;syncTransport();vib(10)}});
  btnFill=h('button',{class:'btn tx',text:'FILL'});
  btnMet=h('button',{class:'btn tx',text:'MET','aria-label':'Metronome',onclick:()=>{A.metro=!A.metro;syncTransport();vib(10);toast(A.metro?'METRONOME ON':'METRONOME OFF')}});
  const fon=()=>{A.fill=true;btnFill.classList.add('on')},foff=()=>{A.fill=false;btnFill.classList.remove('on')};
  btnFill.addEventListener('pointerdown',e=>{e.preventDefault();fon()});
  ['pointerup','pointercancel','pointerleave'].forEach(n=>btnFill.addEventListener(n,foff));
  bpmNum=h('div',{},h('span',{id:'bpmv'}),h('small',{text:'BPM'}));
  let bd=false,bx=0,b0=0;
  bpmNum.addEventListener('pointerdown',e=>{bd=true;bx=e.clientX;b0=P().bpm;try{bpmNum.setPointerCapture(e.pointerId)}catch(x){}});
  bpmNum.addEventListener('pointermove',e=>{if(bd)setBpm(b0+(e.clientX-bx)/4)});
  bpmNum.addEventListener('pointerup',()=>{bd=false});bpmNum.addEventListener('pointercancel',()=>{bd=false});
  scope=h('canvas');sc2=scope.getContext('2d');
  const top=h('div',{class:'top'},
    h('div',{class:'brandrow'},h('div',{class:'logo',text:'ELEPHANT'}),h('button',{class:'btn tsys','aria-label':'System settings',text:'SYS',onclick:()=>go('sys')})),
    h('div',{class:'oled'},h('div',{},h('div',{class:'l1',id:'ol1'}),h('div',{class:'l2',id:'ol2'}),h('div',{class:'l3',id:'ol3'})),scope),
    h('div',{class:'tr'},btnPlay,btnRec,btnFill,btnMet,h('div',{class:'bpm'},h('button',{text:'-',onclick:()=>setBpm(P().bpm-BPM_STEP),'aria-label':'Slower'}),bpmNum,h('button',{text:'+',onclick:()=>setBpm(P().bpm+BPM_STEP),'aria-label':'Faster'}))),
    h('div',{class:'pr'},btnPat=h('button',{class:'btn patb','aria-label':'Patterns',onclick:openPatSheet}),h('button',{class:'btn tmore','aria-label':'More controls',text:'\u22EF',onclick:e=>{const tp=e.currentTarget.closest('.top');tp.classList.toggle('more');vib(6)}}),mvol=h('div',{class:'mvol'},h('span',{text:'VOL'}),HFader(()=>P().vol==null?1:P().vol,v=>{P().vol=v;fxChanged();oled('VOL '+Math.round(v*100)+'%','MASTER');dirty()})),h('button',{class:'chip hist tx','aria-label':'Undo',text:'UNDO',onclick:undo}),h('button',{class:'chip hist tx','aria-label':'Redo',text:'REDO',onclick:redo})));
  const screens=h('div',{class:'screens'},TABS.map(t=>h('div',{class:'screen',id:'s-'+t[0]})));
const nav=h('nav',{class:'nav'},TABS.filter(t=>t[0]!=='smpl'&&t[0]!=='sys').map(t=>{
  const b=h('button',{'data-tab':t[0],'aria-label':t[1],onclick:()=>go(t[0])});
  b.textContent=t[1];
  return b;
}));
  const fsMenu=h('button',{class:'fsb fsmenu','aria-label':'Menu',onclick:()=>fsToggle()},h('i'),h('i'),h('i'));
  U.fsPlay=h('button',{class:'fsb fsplay','aria-label':'Play or stop',text:'\u25B6',onclick:playToggle});
  U.fsPanelBtn=h('button',{class:'fsb fspanelbtn','aria-label':'Sound and step panel',onclick:()=>fsPanelToggle()});
  U.fsPanelBtn.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h9M17 7h3M4 17h3M11 17h9M4 12h16"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/></svg>';
  app.append(top,screens,nav,h('div',{class:'fsstrip'},fsMenu,U.fsPlay,U.fsPanelBtn),h('div',{class:'fsscrim',onclick:()=>fsToggle(false)}),h('div',{class:'brand-l'},h('span',{text:'elephant'}),h('i'),h('small',{text:'16 PAD SAMPLER'})));
  if(!$('#toast'))document.body.append(h('div',{class:'toast',id:'toast',hidden:true}));
  U.fileEl=h('input',{type:'file',accept:'audio/*,.wav,.mp3,.m4a,.aif,.aiff,.flac,.ogg',multiple:true,style:'display:none',onchange:onFile});
  document.body.append(U.fileEl);
  U.projEl=h('input',{type:'file',accept:'.json,.elephant,application/json',style:'display:none',onchange:async()=>{
    const f=U.projEl.files&&U.projEl.files[0];if(!f)return;
    try{const r=GR.unpackProject(await f.text());resetAfterLoad();dirty();toast(r==='full'?'Opened '+f.name:'Opened patterns only, no samples in this file')}
    catch(e){toast('This is not an ELEPHANT file')}
  }});
  document.body.append(U.projEl);
}
function syncTransport(){
  if(U.fsPlay){U.fsPlay.textContent=A.playing?'\u25A0':'\u25B6';U.fsPlay.classList.toggle('on',!!A.playing)}
  if(btnPat)btnPat.textContent=patLabel();
  btnPlay.textContent=A.playing?'STOP':'PLAY';btnPlay.classList.toggle('on',A.playing);
  if(U.sndPlay&&U.sndPlay.isConnected){U.sndPlay.textContent=T(A.playing?'STOP':'PLAY');U.sndPlay.classList.toggle('on',A.playing)}
  btnRec.classList.toggle('on',A.rec);btnMet.classList.toggle('on',A.metro);
  const v=$('#bpmv');if(v)v.textContent=P().bpm;
}
/* a phone held sideways: SEQ and MIX take the whole screen; a MENU button opens the header and the tabs over it */
function fsWant(){return isLandPhone()&&(U.tab==='seq'||U.tab==='mix')}
function fsApply(){const on=fsWant();document.body.classList.toggle('fs',on);document.body.classList.toggle('fsmix',on&&U.tab==='mix');document.body.classList.toggle('fsseq',on&&U.tab==='seq');if(!(on&&U.tab==='seq'))document.body.classList.remove('fspanel');if(!on)document.body.classList.remove('fsopen')}
function fsPanelToggle(){document.body.classList.toggle('fspanel');vib(6);if(U.fitPads)U.fitPads()}
function fsToggle(v){const o=v==null?!document.body.classList.contains('fsopen'):v;document.body.classList.toggle('fsopen',o);vib(6)}
function go(tab){killStepPops();{const cur=document.querySelector('.screen.on');if(cur){U.scr=U.scr||{};U.scr[cur.id]=cur.scrollTop}}
  /* arriving on PLAY from another tab: synth and FM tracks open the keys, drums and samples the pads (not on a phone held sideways, where keys fill the screen) */
  U.tab=tab;fsApply();document.body.classList.remove('fsopen');
  document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('on',b.dataset.tab===(tab==='smpl'?'sound':tab)));
  document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id==='s-'+tab));
  renderTab();
  {const s=document.getElementById('s-'+tab),y=(U.scr||{})[s.id]||0;if(y){s.scrollTop=y;requestAnimationFrame(()=>{s.scrollTop=y})}}
}
const R={};
function renderTab(){const f=R[U.tab];if(f)f()}

