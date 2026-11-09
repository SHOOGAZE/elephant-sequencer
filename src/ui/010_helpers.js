/* ---------- helpers ---------- */
function h(tag,props){
  const e=document.createElement(tag);
  if(props)for(const k in props){const v=props[k];
    if(k==='class')e.className=v;else if(k==='text')e.textContent=T(v);else if(k==='style')e.style.cssText=v;
    else if(k.slice(0,2)==='on')e.addEventListener(k.slice(2),v);else if(v!==false&&v!=null)e.setAttribute(k,v===true?'':(k==='aria-label'||k==='title'||k==='placeholder')&&typeof v==='string'?T(v):v)}
  for(let i=2;i<arguments.length;i++){const c=arguments[i];
    (Array.isArray(c)?c:[c]).forEach(x=>{if(x==null||x===false)return;e.append(x.nodeType?x:document.createTextNode(T(x)))})}
  return e;
}
function icoBtn(cls,label,fn,svg){const b=h('button',{class:cls,'aria-label':label,onclick:fn});b.innerHTML=svg;return b}
let VIB_OFF=false;try{VIB_OFF=localStorage.getItem('elephant-vib')==='0'}catch(e){}
const setVib=off=>{VIB_OFF=off;try{localStorage.setItem('elephant-vib',off?'0':'1')}catch(e){}};
const vib=ms=>{if(VIB_OFF)return;try{navigator.vibrate&&navigator.vibrate(ms)}catch(e){}};
const nname=m=>NN[((m%12)+12)%12]+(Math.floor(m/12)-1);
const trk=()=>P().tracks[U.tr];
const curPat=()=>P().patterns[P().pat];
const TC=Array(16).fill('#dcd8d1');
const tcStyle=i=>{const c=TC[i%16],n=parseInt(c.slice(1),16),l=(.299*(n>>16)+.587*(n>>8&255)+.114*(n&255))/255;return '--tc:'+c+';--tcf:'+(l>.6?'#25221c':'#fff7f0')};
const isSamp=e=>e==='SAMP';
function trackLabel(ti){const t=P().tracks[ti];if(isSamp(t.engine)){const s=S.slots[t.slot];return (s?s.name:'-')}return t.nm||ENG_NAME[t.engine]}
function noteLabel(ti,n){const e=P().tracks[ti].engine;if(isSamp(e))return n===0?'':(n>0?'+':'')+n;return nname(48+n)}
function oled(l2,l3){U.msg=l2;U.msgL3=l3||'';U.msgT=performance.now()}
let toastT=0;
function toast(m,ms){const t=$('#toast');t.textContent=T(m);t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>{t.hidden=true},ms||2400)}
let dirtyT=0;
const H={undo:[],redo:[],cur:null,t:0};
function snapState(){
  const Pj=P();
  return JSON.stringify({patterns:Pj.patterns,tracks:Pj.tracks.map(t=>({engine:t.engine,params:Array.from(t.params),slot:t.slot,mute:t.mute,solo:t.solo,len:t.len,sc:t.sc||0,cmp:t.cmp||null,routes:t.routes||[]})),side:Pj.side,fx:Pj.fx,bpm:Pj.bpm,swing:Pj.swing,pat:Pj.pat,quant:Pj.quant,chain:Pj.chain,song:Pj.song});
}
function histCommit(){
  clearTimeout(H.t);if(!GR.proj)return;
  const st=snapState();
  if(H.cur==null){H.cur=st;return}
  if(st!==H.cur){H.undo.push(H.cur);if(H.undo.length>40)H.undo.shift();H.cur=st;H.redo=[]}
}
function histReset(){clearTimeout(H.t);H.undo=[];H.redo=[];H.cur=snapState()}
function histApply(str){
  const o=JSON.parse(str),Pj=P();
  Pj.patterns=o.patterns;Pj.fx=o.fx;Pj.bpm=o.bpm;Pj.swing=o.swing;Pj.pat=o.pat;Pj.quant=o.quant;Pj.chain=o.chain;Pj.song=o.song;Pj.side=o.side||{src:0,rel:.4};
  o.tracks.forEach((t,i)=>{const T=Pj.tracks[i];T.engine=t.engine;T.params=Float32Array.from(t.params);T.slot=t.slot;T.mute=t.mute;T.solo=t.solo;T.len=t.len;T.sc=t.sc||0;T.cmp=t.cmp||null;T.routes=t.routes||[];T.nm=t.nm});
  if(A.G){A.G.tb.forEach((t,i)=>{if(t)A.G.refreshTrack(i)});GR.applyFx(A.G,Pj,A.ctx.currentTime)}
  U.step=-1;U.lockStep=-1;syncTransport();renderTab();clearTimeout(dirtyT);dirtyT=setTimeout(()=>{GR.store.put('__auto__').catch(()=>{})},800);
}
function undo(){histCommit();if(!H.undo.length){toast('Nothing to undo');return}H.redo.push(H.cur);H.cur=H.undo.pop();histApply(H.cur);toast('Undo');vib(8)}
function redo(){histCommit();if(!H.redo.length){toast('Nothing to redo');return}H.undo.push(H.cur);H.cur=H.redo.pop();histApply(H.cur);toast('Redo');vib(8)}
function dirty(){clearTimeout(dirtyT);dirtyT=setTimeout(()=>{GR.store.put('__auto__').catch(()=>{})},2500);clearTimeout(H.t);H.t=setTimeout(histCommit,500)}
function masterMute(v){GR.mmute=v==null?!GR.mmute:v;fxChanged();vib(10);oled(GR.mmute?'MASTER MUTED':'MASTER ON','MIX');toast(GR.mmute?'Master muted':'Master on')}
function fxChanged(){if(A.G)GR.applyFx(A.G,P(),A.ctx.currentTime)}

