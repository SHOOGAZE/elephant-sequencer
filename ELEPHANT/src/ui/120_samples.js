/* ---------- SAMPLES ---------- */
R.smpl=function(){
  const root=$('#s-smpl');root.replaceChildren();const t=trk();
  const cv=h('canvas',{class:'wave'});
  const slots=h('div',{class:'slots'},S.slots.map((s,i)=>h('button',{class:'chip'+(i===U.slot?' cur':'')+(t.slot===i&&isSamp(t.engine)?' on':''),onclick:()=>{U.slot=i;vib(6);R.smpl();previewSlot(i)}},h('small',{text:String(i+1).padStart(2,'0')}),s.name)));
  const cur=S.slots[U.slot];
  root.append(
    h('div',{class:'plate'},sampSeg('smpl'),h('h3',{},h('span',{text:'SAMPLE POOL'}),h('span',{text:S.slots.length+' / '+S.MAX})),slots,cv,
      h('div',{class:'note sinfo',text:cur?cur.name+'  '+(cur.ch[0].length/cur.rate).toFixed(2)+'s  '+cur.ch.length+'ch  '+(cur.user?'USER':'BUILT-IN'):'EMPTY'}),
      h('div',{class:'row'},
        h('button',{class:'chip or on',text:'LOAD FILE',onclick:()=>{ensureAudio();U.fileEl.value='';U.fileEl.click()}}),
        h('button',{class:'chip',text:A.prev?'STOP':'PLAY',onclick:e=>{if(A.prev){try{A.prev.stop()}catch(x){}A.prev=null;e.currentTarget.textContent=T('PLAY');return}previewSlot(U.slot,true);if(A.prev){e.currentTarget.textContent=T('STOP');const p=A.prev,b=e.currentTarget;p.addEventListener('ended',()=>{if(b.isConnected)b.textContent=T('PLAY')})}}}),
        h('button',{class:'chip',text:'ASSIGN T'+(U.tr+1),onclick:()=>{t.slot=U.slot;if(!isSamp(t.engine)){t.engine='SAMP';t.params=ENGINE_DEFAULT.SAMP()}dirty();toast('Track '+(U.tr+1)+' uses '+cur.name);R.smpl()}})),
      h('div',{class:'row'},h('button',{class:'chip or grow',text:'REC MIC',onclick:e=>micRec(e.currentTarget)})),
      cur?h('div',{class:'row nw'},
        h('button',{class:'chip grow',text:'RENAME',onclick:e=>{
          const inp=h('input',{class:'sname',type:'text',maxlength:'16',value:cur.name,'aria-label':'Sample name'});
          const done=ok=>{if(done.d)return;done.d=true;if(ok){const v=inp.value.trim().toUpperCase().slice(0,16);if(v){cur.name=v;dirty()}}R.smpl()};
          inp.addEventListener('keydown',ev=>{if(ev.key==='Enter')done(true);if(ev.key==='Escape')done(false)});inp.addEventListener('blur',()=>done(true));
          const note=root.querySelector('.sinfo');if(note){note.replaceChildren(inp);inp.focus();inp.select()}}}),
        h('button',{class:'chip grow',text:'DUPLICATE',onclick:()=>{const n=S.add(cur.name+' 2',cur.ch.map(c=>c.slice()),cur.rate,true);if(n<0){toast('Sample slots are full');return}U.slot=n;dirty();toast('Duplicated');R.smpl()}}),
        h('button',{class:'chip grow del'+(U.delArm===U.slot?' on':''),text:U.delArm===U.slot?'TAP AGAIN TO DELETE':'DELETE',onclick:()=>{
          if(!cur.user){toast('Built-in sounds cannot be deleted');return}
          if(U.delArm===U.slot){clearTimeout(U.delT);U.delArm=-1;deleteSlot(U.slot);R.smpl();return}
          U.delArm=U.slot;clearTimeout(U.delT);U.delT=setTimeout(()=>{U.delArm=-1;if(U.tab==='smpl')R.smpl()},3000);R.smpl()}})):null,
      A.cap?h('div',{class:'row grabrow'},h('span',{class:'note lbl',text:'GRAB LAST'}),[1,2,4].map(b=>h('button',{class:'chip grow',text:b+(b>1?' BARS':' BAR'),onclick:()=>grabLast(b)}))):null),
    sampleEditPlate(cur,cv));
  requestAnimationFrame(()=>drawWave(cv));
};
function drawWave(cv){
  const s=S.slots[U.slot],r=cv.getBoundingClientRect(),d=window.devicePixelRatio||1;cv.width=Math.max(10,r.width*d);cv.height=r.height*d;
  const c=cv.getContext('2d'),w0=cv.width,hh=cv.height;c.clearRect(0,0,w0,hh);
  if(!s)return;
  const tr=(U.trim&&U.trim.slot===U.slot)?U.trim:{a:0,b:1},v0=tr.v0||0,v1=tr.v1==null?1:tr.v1,span=Math.max(1e-6,v1-v0);
  const ox=Math.round(5*d),oy=Math.round(15*d),w=Math.max(10,w0-2*ox),ih=hh-oy-Math.round(4*d),cy=oy+ih/2,x=s.ch[0],N=x.length;
  const ink=getComputedStyle(document.documentElement).getPropertyValue('--text').trim()||'#222';
  c.save();c.translate(ox,0);
  c.fillStyle=TH.sc||'#dcd8d1';c.strokeStyle=c.fillStyle;
  const spp=span*N/w;
  if(spp<2){
    c.lineWidth=Math.max(1,1.4*d);c.beginPath();
    for(let i=0;i<=w;i+=1){const f=(v0+span*i/w)*(N-1),i0=Math.floor(f),fr=f-i0,a0=x[i0]||0,a1=x[Math.min(N-1,i0+1)]||0,v=a0+(a1-a0)*fr,yy=cy-v*ih*.5;i?c.lineTo(i,yy):c.moveTo(i,yy)}
    c.stroke();
  }else{
    const per=spp;
    for(let i=0;i<w;i++){const st=Math.floor(v0*N+i*per),en=Math.min(N,Math.max(st+1,Math.floor(v0*N+(i+1)*per)));let m=0;const step=Math.max(1,(en-st)>>4);for(let j=st;j<en;j+=step){const v=Math.abs(x[j]||0);if(v>m)m=v}c.fillRect(i,cy-m*ih*.5,1,Math.max(1,m*ih))}
  }
  const X=p=>(p-v0)/span*w;
  /* region outside the trim handles is dimmed */
  c.save();c.globalAlpha=.22;c.fillStyle=ink;const xa=X(tr.a),xb=X(tr.b);
  if(xa>0)c.fillRect(0,oy,Math.min(w,xa),ih);if(xb<w)c.fillRect(Math.max(0,xb),oy,w-Math.max(0,xb),ih);c.restore();
  const t=trk();
  if(t.slot===U.slot&&t.engine==='SAMP'){c.fillStyle='#dcd8d188';const a=Math.min(t.params[0],t.params[1]),b=Math.max(t.params[0],t.params[1]);c.fillRect(X(a),oy,2*d,ih);c.fillRect(X(b)-2*d,oy,2*d,ih)}
  /* trim handles with time labels */
  const dur=N/s.rate,fs=Math.round(10*d);c.font='700 '+fs+'px sans-serif';c.textBaseline='middle';
  const handle=(p,isB)=>{const xx=X(p);if(xx<-20*d||xx>w+20*d)return;
    c.fillStyle=ink;c.fillRect(xx-1*d,oy-2*d,2*d,ih+4*d);
    c.beginPath();c.roundRect?c.roundRect(xx-(isB?14:2)*d,0,16*d,13*d,4*d):c.rect(xx-(isB?14:2)*d,0,16*d,13*d);c.fill();
    const tx=(p*dur).toFixed(span<.25?3:2)+'s',tw=c.measureText(tx).width;
    let side=isB?1:-1;/* labels sit outside the region: start label to the left, end label to the right */
    if(side<0&&xx-tw-16*d<-ox*.6)side=1;if(side>0&&xx+tw+16*d>w+ox*.6)side=-1;
    c.textAlign=side>0?'left':'right';c.fillText(tx,xx+(side>0?(isB?16:18):-(isB?18:16))*d,7*d)};
  handle(tr.a,false);handle(tr.b,true);
  if(span<.995){c.textAlign='right';c.fillStyle=ink;c.globalAlpha=.7;c.fillText('×'+(1/span).toFixed(span<.1?0:1),w-2*d,hh-7*d);c.globalAlpha=1}
  c.restore();
}
function zeroX(cur,p){
  const x=cur.ch[0],N=x.length,i0=Math.round(p*(N-1)),R=Math.floor(cur.rate*.008);
  for(let d=0;d<=R;d++)for(const i of [i0-d,i0+d]){if(i>=1&&i<N&&x[i-1]*x[i]<=0)return i/(N-1)}
  return p;
}
/* drag trim handles, swipe to select, pinch to zoom, double tap to reset */
function wireWave(cv,cur,tr,refresh){
  if(cv._wired)return;cv._wired=true;
  const P=new Map(),OX=5,N=cur.ch[0].length,minGap=64/N;let g=null,lastTap=0;
  const view=()=>({a:tr.v0||0,b:tr.v1==null?1:tr.v1});
  const W=()=>Math.max(1,cv.getBoundingClientRect().width-2*OX);
  const posAt=px=>{const v=view(),r=cv.getBoundingClientRect();return clamp(v.a+(v.b-v.a)*((px-r.left-OX)/W()),0,1)};
  const px=p=>{const v=view(),r=cv.getBoundingClientRect();return r.left+OX+(p-v.a)/(v.b-v.a)*W()};
  const snap=p=>U.snap===false?p:zeroX(cur,p);
  const redraw=()=>drawWave(cv);
  const pv=(a,b)=>{try{if(!ensureAudio())return;const src=A.ctx.createBufferSource();src.buffer=S.buf(U.slot,false);const gn=A.ctx.createGain();gn.gain.value=.8;src.connect(gn);gn.connect(A.ctx.destination);const dur=src.buffer.duration;src.start(0,a*dur,Math.max(.03,Math.min(.5,(b-a)*dur)))}catch(e){}};
  cv.addEventListener('pointerdown',e=>{
    e.preventDefault();try{cv.setPointerCapture(e.pointerId)}catch(x){}
    P.set(e.pointerId,{x:e.clientX});
    if(P.size>=2){const [p1,p2]=[...P.values()],v=view();g={m:'pinch',d0:Math.abs(p1.x-p2.x)||1,span0:v.b-v.a,anchor:posAt((p1.x+p2.x)/2)};return}
    const da=Math.abs(e.clientX-px(tr.a)),db=Math.abs(e.clientX-px(tr.b));
    if(Math.min(da,db)<26){g={m:da<=db?'a':'b',moved:true}}
    else g={m:'sel',x0:e.clientX,p0:posAt(e.clientX),moved:false};
  });
  cv.addEventListener('pointermove',e=>{
    if(!P.has(e.pointerId)||!g)return;P.get(e.pointerId).x=e.clientX;
    if(g.m==='pinch'&&P.size>=2){
      const [p1,p2]=[...P.values()],dd=Math.abs(p1.x-p2.x)||1,cx=(p1.x+p2.x)/2,r=cv.getBoundingClientRect();
      const ns=clamp(g.span0*g.d0/dd,Math.max(128/N,1e-5),1),f=clamp((cx-r.left-OX)/W(),0,1);
      let a=g.anchor-f*ns;a=clamp(a,0,1-ns);tr.v0=a;tr.v1=a+ns;redraw();return}
    if(g.m==='a'){tr.a=Math.min(snap(posAt(e.clientX)),tr.b-minGap);tr.a=Math.max(0,tr.a);redraw()}
    else if(g.m==='b'){tr.b=Math.max(snap(posAt(e.clientX)),tr.a+minGap);tr.b=Math.min(1,tr.b);redraw()}
    else if(g.m==='sel'){
      if(!g.moved&&Math.abs(e.clientX-g.x0)<7)return;g.moved=true;
      const q=posAt(e.clientX);let a=snap(Math.min(g.p0,q)),b=snap(Math.max(g.p0,q));if(b-a<minGap)b=Math.min(1,a+minGap);tr.a=a;tr.b=b;redraw()}
  });
  const end=e=>{
    if(!P.has(e.pointerId))return;P.delete(e.pointerId);
    if(!g)return;const gg=g;
    if(gg.m==='pinch'){if(P.size<2)g={m:'none'};return}
    if(P.size>0)return;g=null;
    if(gg.m==='a'){pv(tr.a,tr.b);refresh()}
    else if(gg.m==='b'){pv(Math.max(tr.a,tr.b-.35),tr.b);refresh()}
    else if(gg.m==='sel'){
      if(gg.moved){pv(tr.a,tr.b);refresh()}
      else{const now=performance.now();if(now-lastTap<330){tr.v0=0;tr.v1=1;redraw();refresh();lastTap=0}else lastTap=now}
    }
  };
  cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);
}
function previewSlot(i,region){
  if(!ensureAudio()||!S.slots[i])return;
  if(A.prev){try{A.prev.stop()}catch(e){}A.prev=null}
  const src=A.ctx.createBufferSource();src.buffer=S.buf(i,false);const g=A.ctx.createGain();g.gain.value=.8;src.connect(g);g.connect(A.ctx.destination);
  const tr=U.trim,d=src.buffer.duration;
  if(region&&tr&&tr.slot===i&&(tr.a>0||tr.b<1))src.start(0,tr.a*d,Math.max(.02,(tr.b-tr.a)*d));else src.start();
  A.prev=src;src.onended=()=>{if(A.prev===src)A.prev=null}
}
/* remove a sample slot: tracks that used it fall back to slot 1, later slots shift down */
function deleteSlot(i){
  const s=S.slots[i];if(!s)return false;
  if(!s.user){toast('Built-in sounds cannot be deleted');return false}
  if(A.prev){try{A.prev.stop()}catch(e){}A.prev=null}
  S.slots.splice(i,1);GR.smpRev=(GR.smpRev||0)+1;
  P().tracks.forEach(t=>{if(t.slot===i)t.slot=0;else if(t.slot>i)t.slot--});
  (U.sUndo||[]).length=0;U.slot=Math.max(0,Math.min(U.slot,S.slots.length-1));U.trim={a:0,b:1,slot:U.slot};
  dirty();histReset();toast('Deleted');return true;
}
/* Safari is picky about some WAV files (odd chunks, 24 bit, extensible headers), so WAV gets a plain parser as a fallback */
function parseWav(ab){
  const v=new DataView(ab);if(v.byteLength<44||v.getUint32(0)!==0x52494646||v.getUint32(8)!==0x57415645)throw new Error('not wav');
  let p=12,fmt=null,data=null;
  while(p+8<=v.byteLength){const id=v.getUint32(p),n=v.getUint32(p+4,true);
    if(id===0x666d7420)fmt={tag:v.getUint16(p+8,true),ch:v.getUint16(p+10,true),rate:v.getUint32(p+12,true),bits:v.getUint16(p+22,true),sub:n>=26?v.getUint16(p+32,true):0};
    else if(id===0x64617461){data=[p+8,Math.min(n,v.byteLength-p-8)];break}
    p+=8+n+(n&1)}
  if(!fmt||!data)throw new Error('no data');
  const tag=fmt.tag===0xFFFE?fmt.sub:fmt.tag,bps=fmt.bits>>3,nc=Math.max(1,Math.min(fmt.ch,2)),frame=bps*fmt.ch,len=Math.floor(data[1]/frame);
  if(!(tag===1&&[1,2,3,4].includes(bps))&&!(tag===3&&(bps===4||bps===8)))throw new Error('format');
  const out=[];for(let c=0;c<nc;c++){const d=new Float32Array(len);
    for(let i=0;i<len;i++){const o=data[0]+i*frame+c*bps;let x;
      if(tag===3)x=bps===4?v.getFloat32(o,true):v.getFloat64(o,true);
      else if(bps===1)x=(v.getUint8(o)-128)/128;else if(bps===2)x=v.getInt16(o,true)/32768;
      else if(bps===3)x=((v.getUint8(o)|v.getUint8(o+1)<<8|v.getInt8(o+2)<<16))/8388608;else x=v.getInt32(o,true)/2147483648;
      d[i]=x}out.push(d)}
  return{ch:out,rate:fmt.rate}
}
async function decodeFile(f,maxSec){
  const raw=await f.arrayBuffer();let ch,rate;
  try{const ab=await A.ctx.decodeAudioData(raw.slice(0));ch=[];for(let c=0;c<Math.min(2,ab.numberOfChannels);c++)ch.push(ab.getChannelData(c).slice());rate=ab.sampleRate}
  catch(e){const w=parseWav(raw);ch=w.ch;rate=w.rate}
  if(maxSec){const m=Math.floor(rate*maxSec);ch=ch.map(d=>d.length>m?d.slice(0,m):d)}
  return{ch,rate};
}
async function loadFiles(fs){
  fs=[...fs];if(!fs.length||!ensureAudio())return;
  let n=0,bad=0,full=false;toast('Loading '+(fs.length>1?fs.length+' files':fs[0].name));
  for(const f of fs){
    if(S.slots.length>=S.MAX){full=true;break}
    try{const d=await decodeFile(f);
      const nm=f.name.replace(/\.[^.]+$/,'').toUpperCase().slice(0,10)||'FILE';
      U.slot=S.add(nm,d.ch,d.rate,true);n++}
    catch(e){bad++}
  }
  if(n)dirty();
  toast(full&&!n?'Sample slots are full':!n?'Could not read this file. Try wav, mp3 or m4a.':(n===1&&!bad?T('Loaded into slot ')+(U.slot+1):T('Loaded')+' '+n+' / '+fs.length));
  if(n&&U.tab==='smpl')R.smpl();
}
const onFile=()=>{const fs=U.fileEl.files;if(fs&&fs.length)loadFiles(fs)};
function sampleEditPlate(cur,cv){
  if(U.trim.slot!==U.slot){U.trim={a:0,b:1,slot:U.slot}}
  const tr=U.trim;
  if(!cur)return h('div',{class:'plate'},h('h3',{text:'EDIT SAMPLE'}),h('div',{class:'note',text:'Pick a filled slot to edit it.'}));
  const L=cur.ch[0].length,redraw=()=>drawWave(cv);
  const refresh=()=>{const np=sampleEditPlate(cur,cv);if(U.editEl&&U.editEl.isConnected)U.editEl.replaceWith(np);U.editEl=np};
  const apply=fn=>{GR.smpRev=(GR.smpRev||0)+1;(U.sUndo=U.sUndo||[]).push({slot:U.slot,ch:cur.ch});if(U.sUndo.length>12)U.sUndo.shift();fn();cur.buf=null;cur.rev=null;cur.user=true;U.trim={a:0,b:1,slot:U.slot};dirty();R.smpl()};
  const el=h('div',{class:'plate'},h('h3',{},h('span',{text:'EDIT SAMPLE'}),h('span',{text:(L/cur.rate).toFixed(2)+' s'})),
    h('div',{class:'kgrid',style:'grid-template-columns:repeat(2,1fr)'},
      Knob({label:'TRIM START',small:true,get:()=>tr.a,set:v=>{tr.a=Math.min(v,tr.b-.01);redraw()},fmt:v=>(v*L/cur.rate).toFixed(2)+'s',reset:()=>{tr.a=0}}),
      Knob({label:'TRIM END',small:true,get:()=>tr.b,set:v=>{tr.b=Math.max(v,tr.a+.01);redraw()},fmt:v=>(v*L/cur.rate).toFixed(2)+'s',reset:()=>{tr.b=1}})),
    h('div',{class:'row'},
      h('button',{class:'chip or on',text:'CROP',onclick:()=>apply(()=>{const a=Math.floor(tr.a*L),b=Math.max(a+64,Math.floor(tr.b*L));cur.ch=cur.ch.map(c=>c.slice(a,b));toast('Cropped')})}),
      h('button',{class:'chip',text:'CUT',onclick:()=>{const a=Math.floor(tr.a*L),b=Math.floor(tr.b*L);if(b-a<2||L-(b-a)<64){toast('Select a smaller region to cut');return}apply(()=>{cur.ch=cur.ch.map(c=>{const o=new Float32Array(c.length-(b-a));o.set(c.subarray(0,a));o.set(c.subarray(b),a);return o});toast('Cut')})}}),
      h('button',{class:'chip',text:'TRIM SILENCE',onclick:()=>{const th=.003;let f=L,l=-1;cur.ch.forEach(c=>{for(let i=0;i<c.length;i++)if(Math.abs(c[i])>th){if(i<f)f=i;break}for(let i=c.length-1;i>=0;i--)if(Math.abs(c[i])>th){if(i>l)l=i;break}});const m=Math.floor(cur.rate*.005);f=Math.max(0,f-m);l=Math.min(L-1,l+m);if(l<f||(f===0&&l===L-1)||l-f<64){toast('Nothing to trim');return}apply(()=>{cur.ch=cur.ch.map(c=>c.slice(f,l+1));toast('Silence trimmed')})}})),
    h('div',{class:'row'},
      h('button',{class:'chip',text:'NORMALIZE',onclick:()=>apply(()=>{let pk=0;cur.ch.forEach(c=>{for(let i=0;i<c.length;i++){const v=Math.abs(c[i]);if(v>pk)pk=v}});if(pk>0){const g=.95/pk;cur.ch=cur.ch.map(c=>c.map(x=>x*g))}toast('Normalized')})}),
      h('button',{class:'chip',text:'GAIN -',onclick:()=>apply(()=>{const g=Math.pow(10,-3/20);cur.ch=cur.ch.map(c=>c.map(x=>x*g));toast('-3 dB')})}),
      h('button',{class:'chip',text:'GAIN +',onclick:()=>apply(()=>{const g=Math.pow(10,3/20);cur.ch=cur.ch.map(c=>c.map(x=>Math.max(-1,Math.min(1,x*g))));toast('+3 dB')})}),
      h('button',{class:'chip',text:'REVERSE',onclick:()=>apply(()=>{cur.ch=cur.ch.map(c=>c.slice().reverse());toast('Reversed')})})),
    h('div',{class:'row'},
      h('button',{class:'chip',text:'FADE IN',onclick:()=>apply(()=>{cur.ch=cur.ch.map(c=>{const o=c.slice(),n=Math.min(o.length,Math.floor(cur.rate*.08));for(let i=0;i<n;i++)o[i]*=i/n;return o});toast('Faded')})}),
      h('button',{class:'chip',text:'FADE OUT',onclick:()=>apply(()=>{cur.ch=cur.ch.map(c=>{const o=c.slice(),n=Math.min(o.length,Math.floor(cur.rate*.08));for(let i=0;i<n;i++)o[o.length-1-i]*=i/n;return o});toast('Faded')})}),
      h('button',{class:'chip',text:'UNDO EDIT',onclick:()=>{const u=U.sUndo||[];let k=u.length-1;while(k>=0&&u[k].slot!==U.slot)k--;if(k<0){toast('Nothing to undo');return}GR.smpRev=(GR.smpRev||0)+1;cur.ch=u.splice(k,1)[0].ch;cur.buf=null;cur.rev=null;U.trim={a:0,b:1,slot:U.slot};dirty();toast('Undone');R.smpl()}}),
      h('button',{class:'chip'+(U.snap!==false?' on':''),text:'SNAP',onclick:()=>{U.snap=U.snap===false;refresh()}})),
    h('div',{class:'note',text:'Drag the handles on the wave to trim. Swipe on empty space to select a region. Pinch to zoom, double tap to reset.'}),
    h('div',{class:'note',text:'Edits change the slot itself, so every track using it follows. They are saved with the project.'}));
  U.editEl=el;wireWave(cv,cur,tr,refresh);return el;
}
const hasClaudeDl=()=>!!(window.claude&&window.claude.use);
async function downloadFile(filename,data){
  try{
    if(hasClaudeDl()){
      const dl=await window.claude.use('downloads');
      if(dl){await dl.save({filename,data});toast('Saved '+filename);return true}
    }
    const blob=data instanceof Blob?data:new Blob([data]),url=URL.createObjectURL(blob),a=h('a',{href:url,download:filename});
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);
    toast('Saved '+filename);return true;
  }catch(e){toast(e&&e.code==='declined'?'Save cancelled':'Could not save the file');return false}
}
async function exportMix(){
  if(U.busy)return;U.busy=true;R.sys();toast('Rendering '+expB()+' bars');
  try{
    const buf=await GR.renderOffline({bars:expB(),tail:2}),wav=GR.encodeWav(GR.bufToChannels(buf),buf.sampleRate);
    const nm=(P().name||'untitled').replace(/[^\w\- ]+/g,'').trim()||'untitled';
    if(hasClaudeDl())await downloadFile(nm+'.zip',GR.zipStore(nm+'.wav',wav));
    else await downloadFile(nm+'.wav',new Blob([wav],{type:'audio/wav'}));
  }catch(e){toast('Render failed')}
  U.busy=false;R.sys();
}
function midiPlate(){
  const ok=!!navigator.requestMIDIAccess;
  return h('div',{class:'plate'},h('h3',{},h('span',{text:'MIDI IN'}),h('span',{text:U.midi?U.midi.n+' INPUT'+(U.midi.n===1?'':'S'):'OFF'})),
    ok?h('button',{class:'btn'+(U.midi?' on':''),text:U.midi?'MIDI IN IS ON':'ENABLE MIDI IN',onclick:enableMidi}):null,
    h('div',{class:'note',text:ok?'Play the selected track from a MIDI keyboard. Pitch bend and the mod wheel (CC1) are supported.':'Web MIDI is not available in this browser. It works in Chrome and Edge on desktop and Android. iOS Safari does not support it.'}));
}
