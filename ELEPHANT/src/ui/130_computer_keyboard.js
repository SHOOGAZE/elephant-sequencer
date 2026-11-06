/* ---------- computer keyboard: 7 8 9 0 / U I O P / J K L ; / M , . /  = pads 1-16, SPACE plays and stops. MIDI: drum pads on channel 10 (notes 36-51) ---------- */
const PCP={Digit7:0,Digit8:1,Digit9:2,Digit0:3,KeyU:4,KeyI:5,KeyO:6,KeyP:7,KeyJ:8,KeyK:9,KeyL:10,Semicolon:11,KeyM:12,Comma:13,Period:14,Slash:15};
const pcHeld=new Set();
function padHit(ti,vel){
  if(!ensureAudio())return;U.tr=ti;
  const pads=document.querySelectorAll('#s-play .pad');pads.forEach(p=>{p.classList.toggle('sel',+p.dataset.t===ti);if(+p.dataset.t===ti){p.classList.add('hit');setTimeout(()=>p.classList.remove('hit'),130)}});
  playNow(ti,0,vel,1);
}
addEventListener('keydown',e=>{
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  const tg=e.target,tn=tg&&tg.tagName;if(tn==='INPUT'||tn==='TEXTAREA'||tn==='SELECT'||(tg&&tg.isContentEditable))return;
  if(!['play','sound','seq'].includes(U.tab))return;
  if(e.code==='Space'){if(tn==='BUTTON')return;e.preventDefault();if(!e.repeat)playToggle();return}
  if(e.repeat||pcHeld.has(e.code))return;
  const pi=PCP[e.code];if(pi==null||U.tab==='sound')return;
  e.preventDefault();pcHeld.add(e.code);padHit(pi,.85);
});
addEventListener('keyup',e=>pcHeld.delete(e.code));
addEventListener('blur',()=>pcHeld.clear());
async function enableMidi(){
  if(U.midi){return}
  try{
    const acc=await navigator.requestMIDIAccess(),st={n:0,acc};
    const msg=e=>{const d=e.data,cmd=d[0]&0xf0;if((d[0]&15)===9&&cmd===0x90&&d[2]>0&&d[1]>=36&&d[1]<52)padHit(d[1]-36,Math.max(.3,d[2]/127))};
    const hook=()=>{st.n=0;acc.inputs.forEach(i=>{i.onmidimessage=msg;st.n++});if(U.tab==='sys')R.sys()};
    acc.onstatechange=hook;U.midi=st;hook();try{localStorage.setItem('elephant-midi','1')}catch(e){}toast(st.n?'MIDI in: '+st.n+' device(s)':'MIDI on. Connect a drum pad controller');
  }catch(e){toast('MIDI access was not granted')}
  R.sys();
}
setTimeout(()=>{try{if(localStorage.getItem('elephant-midi')==='1'&&navigator.requestMIDIAccess&&!U.midi)enableMidi()}catch(e){}},900);
let tapT=[];
function tapTempo(){
  const n=performance.now();if(tapT.length&&n-tapT[tapT.length-1]>2200)tapT=[];
  tapT.push(n);if(tapT.length>6)tapT.shift();
  if(tapT.length>=2){const iv=(tapT[tapT.length-1]-tapT[0])/(tapT.length-1);setBpm(60000/iv);oled('TAP '+P().bpm+' BPM','')}
  vib(8);
}
async function exportStems(){
  if(U.busy)return;U.busy=true;R.sys();
  try{
    const Pj=P(),pat=Pj.patterns[Pj.pat],files=[],nm=(Pj.name||'untitled').replace(/[^\w\- ]+/g,'').trim()||'untitled';
    for(let ti=0;ti<16;ti++){
      if(!pat[ti].some(x=>x.on))continue;
      toast('Rendering track '+(ti+1));
      const buf=await GR.renderOffline({bars:expB(),tail:2,only:ti});
      files.push({name:nm+'_T'+String(ti+1).padStart(2,'0')+'_'+trackLabel(ti).replace(/[^\w]+/g,'')+'.wav',data:GR.encodeWav(GR.bufToChannels(buf),buf.sampleRate)});
    }
    if(!files.length)toast('No steps to render');
    else await downloadFile(nm+'_stems.zip',GR.zipMulti(files));
  }catch(e){toast('Render failed')}
  U.busy=false;R.sys();
}
/* an export is never shorter than one full pattern, which can be up to 4 bars with 64 steps */
const expB=()=>Math.max(U.expBars,GR.patLen(P())/16);
async function exportMidi(){
  const Pj=P(),nm=(Pj.name||'untitled').replace(/[^\w\- ]+/g,'').trim()||'untitled',mid=GR.midiFile(Pj,expB());
  if(hasClaudeDl())await downloadFile(nm+'_midi.zip',GR.zipMulti([{name:nm+'.mid',data:mid}]));
  else await downloadFile(nm+'.mid',new Blob([mid],{type:'audio/midi'}));
}
async function refreshSaved(){try{U.saved=await GR.store.list()}catch(e){U.saved=[]}if(U.tab==='sys')R.sys()}
function resetAfterLoad(){
  A.playing=false;A.queue=[];U.tr=0;U.step=-1;U.lockStep=-1;U.slot=0;
  if(A.G){A.G.tb.forEach((t,i)=>{if(t)A.G.refreshTrack(i)});GR.applyFx(A.G,P(),A.ctx.currentTime)}
  syncTransport();renderTab();histReset();
}
let recM=null,recChunks=[],recT0=0;
function toggleRec(){
  if(recM){recM.stop();return}
  if(!ensureAudio()||!A.G||!A.G.rec||typeof MediaRecorder==='undefined'){toast('Live recording is not supported here');return}
  try{
    const mt=['audio/mp4','audio/webm;codecs=opus','audio/webm'].find(m=>MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(m))||'';
    recM=new MediaRecorder(A.G.rec.stream,mt?{mimeType:mt}:undefined);recChunks=[];recT0=Date.now();
    recM.ondataavailable=e=>{if(e.data&&e.data.size)recChunks.push(e.data)};
    recM.onstop=()=>{const ext=/mp4/.test(recM.mimeType)?'m4a':'webm',blob=new Blob(recChunks,{type:recM.mimeType||'audio/webm'});recM=null;downloadFile((P().name||'elephant')+'-live.'+ext,blob);if(U.tab==='sys')R.sys()};
    recM.start();toast('Recording. Play, then tap STOP');if(U.tab==='sys')R.sys();
  }catch(e){recM=null;toast('Could not start recording')}
}
function perfPlate(){
  return h('div',{class:'plate'},h('h3',{text:'LIVE'}),
    h('div',{class:'row nw'},
      h('button',{class:'btn grow'+(recM?' on':''),text:recM?'STOP AND SAVE':'RECORD LIVE',onclick:toggleRec}),
      h('button',{class:'btn grow'+(GR.lite?' on':''),text:'LITE MODE '+(GR.lite?'ON':'OFF'),onclick:()=>{GR.lite=!GR.lite;try{localStorage.setItem('elephant-lite',GR.lite?'1':'0')}catch(e){}R.sys()}})),
    h('div',{class:'note',text:'RECORD LIVE captures everything you hear, including effects, as an audio file. LITE MODE caps unison and the number of voices so older phones keep up.'}));
}
R.sys=function(){
  const root=$('#s-sys');root.replaceChildren();const Pj=P();
  const name=h('input',{class:'input',value:Pj.name,maxlength:'24',oninput:e=>{Pj.name=e.target.value.trim()||'untitled'},onchange:e=>{Pj.name=e.target.value.trim()||'untitled';dirty()},'aria-label':'Project name'});
  const list=h('div',{class:'list'},U.saved.length?U.saved.map(s=>h('div',{class:'it'},h('span',{text:s.name}),
    h('button',{class:'chip xs',text:'LOAD',onclick:async()=>{try{if(await GR.store.load(s.name)){resetAfterLoad();toast('Loaded '+s.name)}}catch(e){toast('Could not load')}}}),
    h('button',{class:'chip xs',text:'DEL',onclick:async()=>{try{await GR.store.del(s.name);refreshSaved()}catch(e){}}}))):[h('div',{class:'note',text:'No saved projects yet.'})]);
  root.append(
    h('div',{class:'plate'},h('h3',{text:'STARTER PRESETS'}),h('div',{class:'row wrap presrow'},GR.presets.map((p,i)=>h('button',{class:'btn grow'+(U.psArm===i?' on':''),text:U.psArm===i?'TAP AGAIN':p.name,onclick:()=>{if(U.psArm!==i&&hasContent()){U.psArm=i;clearTimeout(U.psT);U.psT=setTimeout(()=>{U.psArm=-1;if(U.tab==='sys')R.sys()},3000);R.sys();return}U.psArm=-1;startPreset(i)}}))),h('div',{class:'note',text:'Starter grooves (dub techno, house, broken beat) with their own synthesised sounds, FX and patterns A to C. Loading one replaces the current project.'})),
    h('div',{class:'plate'},h('h3',{text:'PROJECT'}),name,
      h('div',{class:'row nw'},
        h('button',{class:'btn on grow',text:'SAVE',onclick:async()=>{Pj.name=name.value.trim()||'untitled';try{await GR.store.put(Pj.name);toast('Saved '+Pj.name);refreshSaved()}catch(e){toast('Saving is not available here')}}}),
        h('button',{class:'btn grow',text:'NEW',onclick:()=>{GR.Samples.builtin();GR.proj=GR.defaultProject();resetAfterLoad();toast('New project')}}),
        h('button',{class:'btn grow',text:'SAVE FILE',onclick:()=>{try{downloadFile((Pj.name||'untitled').replace(/[^\w\- ]+/g,'')+'.elephant.json',GR.packProject())}catch(e){toast('Could not save the file')}}}),
        h('button',{class:'btn grow',text:'OPEN FILE',onclick:()=>{U.projEl.value='';U.projEl.click()}})),
      list,h('div',{class:'note',text:'Projects and your samples are stored in this browser. SAVE FILE writes one file with the patterns and your samples, so you can back it up or move it to another device. Changes are also kept automatically.'})),
    h('div',{class:'plate'},h('h3',{text:'EXPORT MIX'}),
      h('div',{class:'row'},chipRow(['1 BAR','2 BARS','4 BARS','8 BARS','16 BARS'],i=>U.expBars===[1,2,4,8,16][i],i=>{U.expBars=[1,2,4,8,16][i];R.sys()})),
      h('button',{class:'btn on',text:U.busy?'RENDERING':'RENDER WAV',disabled:U.busy,onclick:exportMix}),
      h('div',{class:'row nw'},
        h('button',{class:'btn grow',text:'STEMS',disabled:U.busy,onclick:exportStems}),
        h('button',{class:'btn grow',text:'MIDI FILE',disabled:U.busy,onclick:exportMidi})),
      h('div',{class:'note',text:'STEMS renders every track that has steps into its own WAV. MIDI FILE writes the current pattern with one MIDI track per groove track.'}),
      h('div',{class:'note',text:'Renders the current pattern offline in 16 bit stereo. The file arrives as a ZIP with the WAV inside, because this page can only save a fixed set of file types.'})),
    h('div',{class:'plate'},h('h3',{text:'GROOVE'}),
      h('div',{class:'kgrid',style:'grid-template-columns:repeat(4,1fr)'},
        Knob({label:'SWING',get:()=>Pj.swing*2,set:v=>{Pj.swing=v/2;dirty()},fmt:v=>Math.round(50+v*25)+'%',reset:()=>{Pj.swing=.12}}),
        Knob({label:'BPM',get:()=>(Pj.bpm-50)/170,set:v=>{setBpm(50+v*170)},fmt:v=>Math.round(50+v*170),reset:()=>setBpm(122)})),
      h('div',{class:'row nw'},
        h('button',{class:'chip grow',text:'TAP TEMPO',onclick:tapTempo}),
        h('button',{class:'chip grow or'+(U.countIn?' on':''),text:'COUNT-IN '+(U.countIn?'ON':'OFF'),onclick:()=>{U.countIn=!U.countIn;R.sys()}})),
      h('div',{class:'row nw hfrow'},h('span',{class:'note lbl',text:'METRONOME'}),HFader(()=>U.metVol==null?1:U.metVol,v=>{U.metVol=v;try{localStorage.setItem('elephant-metvol',String(v))}catch(e){}oled('MET VOL '+Math.round(v*100)+'%','')}),h('button',{class:'chip xs',text:'TEST',onclick:()=>{if(ensureAudio())click(A.ctx,A.ctx.currentTime+.02,true)}})),
      h('div',{class:'note',text:'COUNT-IN plays one bar of clicks before recording starts when REC is armed.'})),
    perfPlate(),
    ...(navigator.requestMIDIAccess?[midiPlate()]:[]),
    h('div',{class:'plate'},h('h3',{text:'LANGUAGE'}),h('div',{class:'row nw'},['en','ru','uk','es','de'].map(l=>h('button',{class:'chip grow'+(LANG===l?' on':''),text:l==='uk'?'UA':l.toUpperCase(),onclick:()=>{setLang(l);vib(6);R.sys()}})))),
    h('div',{class:'plate'},h('h3',{text:'LOOK'}),
      h('div',{class:'row nw'},chipRow(['HINTS ON','HINTS OFF'],i=>(document.documentElement.classList.contains('nohint'))===(i===1),i=>{setHints(i===1);R.sys()},'grow'))),
    h('div',{class:'plate'},h('h3',{text:'HELP'}),h('div',{class:'row nw'},
      h('button',{class:'btn on grow',text:'TUTORIAL',onclick:()=>startTour(0)}))),
    h('div',{class:'plate'},h('h3',{text:'ABOUT'}),h('div',{class:'note',text:'ELEPHANT. A pocket sampler groovebox: 16 pads, up to 64 steps with P-locks, micro timing, trig conditions, retrigs, a sampler with slices, a compressor per track and a master FX chain.'})));
  const rare=['GROOVE','LIVE','MIDI IN','ABOUT'],ps=[...root.children].filter(p=>{const x=p.querySelector('h3');return x&&rare.some(r=>x.textContent.trim().startsWith(r))});
  if(ps.length){const more=h('div',{class:'sysmore'});ps.forEach(p=>more.append(p));more.hidden=!U.sysMore;
    root.append(h('button',{class:'btn grow',style:'margin:6px 0',text:U.sysMore?'FEWER SETTINGS':'MORE SETTINGS',onclick:()=>{U.sysMore=!U.sysMore;R.sys()}}),more)}
  refreshSavedOnce();
};
let savedOnce=false;
function refreshSavedOnce(){if(savedOnce)return;savedOnce=true;refreshSaved()}


const hasContent=()=>S.slots.length>0||P().patterns.some(p=>p.some(r=>r.some(s=>s.on)));
function startPreset(i){ensureAudio();GR.loadPreset(i);resetAfterLoad();dirty();toast('Loaded '+GR.presets[i].name+'. Press PLAY, patterns A to '+String.fromCharCode(64+GR.presets[i].patterns))}
