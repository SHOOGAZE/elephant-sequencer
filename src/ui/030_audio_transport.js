/* ---------- audio / transport ---------- */
function ensureAudio(){
  if(!A.ctx){
    try{const AC=window.AudioContext||window.webkitAudioContext;A.ctx=new AC({latencyHint:'interactive'})}catch(e){toast('Audio is not available here');return false}
    A.G=GR.buildGraph(A.ctx);GR.applyFx(A.G,P(),A.ctx.currentTime);startClock();startCapture();GR.attachFx(A.G).then(ok=>{if(ok&&A.G)GR.applyFx(A.G,P(),A.ctx.currentTime)});
    A.ctx.onstatechange=()=>{if(A.ctx.state!=='running'&&!document.hidden)A.ctx.resume().catch(()=>{})};
  }
  if(A.ctx.state!=='running')A.ctx.resume().catch(()=>{});
  iosUnlock();
  return true;
}
/* the step clock lives in a Worker: its timer is not held back by page layout or scroll work and not throttled like a page timer.
   if a Worker cannot be made (file:// in some browsers, strict CSP) it falls back to a page interval. */
function startClock(){
  if(A.clock)return;
  try{
    const src='let t=0;onmessage=e=>{clearInterval(t);if(e.data>0)t=setInterval(()=>postMessage(0),e.data)}',u=URL.createObjectURL(new Blob([src],{type:'text/javascript'})),w=new Worker(u);
    w.onmessage=()=>tick();w.postMessage(25);A.clock={w,kind:'worker'};
  }catch(e){setInterval(tick,25);A.clock={kind:'interval'}}
}
/* GRAB: the master output is always kept for the last 20 s in a ring buffer inside an AudioWorklet. GRAB LAST copies the last bars
   into a new sample slot. Because it hears the master, it is retro-capture and resampling in one: grab a groove, then play or chop it. */
const CAPSEC=20;
function startCapture(){
  const ctx=A.ctx;if(!ctx.audioWorklet||A.cap)return;
  const src="class C extends AudioWorkletProcessor{constructor(o){super();const n=Math.ceil(sampleRate*"+CAPSEC+");this.b=[new Float32Array(n),new Float32Array(n)];this.n=n;this.w=0;this.p=0;this.port.onmessage=e=>{const k=Math.min(this.w,Math.floor(e.data*sampleRate),this.n),o=[new Float32Array(k),new Float32Array(k)];for(let c=0;c<2;c++)for(let i=0;i<k;i++)o[c][i]=this.b[c][(this.p-k+i+this.n)%this.n];this.port.postMessage(o,[o[0].buffer,o[1].buffer])}}process(i){const x=i[0];if(!x||!x[0])return true;const L=x[0],R=x[1]||x[0];for(let j=0;j<L.length;j++){this.b[0][this.p]=L[j];this.b[1][this.p]=R[j];this.p=(this.p+1)%this.n}this.w=Math.min(this.n,this.w+L.length);return true}}registerProcessor('cap',C)";
  ctx.audioWorklet.addModule('data:text/javascript;base64,'+btoa(src)).then(()=>{
    const n=new AudioWorkletNode(ctx,'cap',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[2]});
    A.G.an.connect(n);const z=ctx.createGain();z.gain.value=0;n.connect(z);z.connect(ctx.destination);A.cap=n;
    if(U.tab==='smpl')R.smpl();
  }).catch(()=>{});
}
/* REC MIC: records up to 10 s from the microphone into a new sample slot. needs a secure page and the person's permission */
async function micRec(btn){
  if(U.mic){U.mic.stop();return}
  if(!ensureAudio())return;
  if(!navigator.mediaDevices||!window.MediaRecorder){toast('Microphone is not available here');return}
  let st;try{st=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}})}catch(e){toast('Microphone is not available here');return}
  const rec=new MediaRecorder(st),chunks=[],t0=performance.now();U.mic=rec;btn.classList.add('on');
  const tm=setInterval(()=>{const sec=(performance.now()-t0)/1000;if(btn.isConnected)btn.textContent=T('STOP')+' '+sec.toFixed(1)+'s';if(sec>=10)rec.stop()},100);
  rec.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
  rec.onstop=async()=>{
    clearInterval(tm);st.getTracks().forEach(x=>x.stop());U.mic=null;
    try{
      const b=await A.ctx.decodeAudioData(await new Blob(chunks,{type:rec.mimeType}).arrayBuffer()),ch=[];
      for(let c=0;c<Math.min(2,b.numberOfChannels);c++)ch.push(Float32Array.from(b.getChannelData(c)));
      let pk=0;ch.forEach(c=>{for(let i=0;i<c.length;i++){const v=Math.abs(c[i]);if(v>pk)pk=v}});
      if(pk>0&&pk<.5){const g=.9/pk;ch.forEach(c=>{for(let i=0;i<c.length;i++)c[i]*=g})}/* a quiet recording is lifted to a normal level */
      if(S.slots.length>=S.MAX){toast('Sample slots are full');return}
      U.slot=S.add('MIC '+(S.slots.filter(s=>/^MIC/.test(s.name)).length+1),ch,b.sampleRate,true);dirty();vib(10);
      toast(T('Grabbed into slot ')+(U.slot+1));if(U.tab==='smpl')R.smpl();
    }catch(e){toast('Could not read the recording')}
  };
  rec.start();
}
function grabLast(bars){
  if(!A.cap)return;
  const sec=Math.min(CAPSEC,bars*4*60/P().bpm);
  A.cap.port.onmessage=e=>{
    const ch=e.data;
    if(!ch[0].length||ch[0].length<A.ctx.sampleRate*.2){toast('Nothing to grab yet. Play something first.');return}
    if(S.slots.length>=S.MAX){toast('Sample slots are full');return}
    U.slot=S.add('GRAB '+(S.slots.filter(s=>/^GRAB/.test(s.name)).length+1),ch,A.ctx.sampleRate,true);dirty();vib(10);
    toast(T('Grabbed into slot ')+(U.slot+1));if(U.tab==='smpl')R.smpl();
  };
  A.cap.port.postMessage(sec);
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&A.ctx&&A.ctx.state!=='running')A.ctx.resume().catch(()=>{})});
let iosDone=false;
function iosUnlock(){
  if(iosDone)return;iosDone=true;
  try{if(navigator.audioSession)navigator.audioSession.type='playback'}catch(e){}
  try{
    const wav=GR.encodeWav([new Float32Array(4410)],22050),au=new Audio(URL.createObjectURL(new Blob([wav],{type:'audio/wav'})));
    au.loop=true;au.volume=.01;au.setAttribute('playsinline','');au.play().catch(()=>{});
  }catch(e){}
}
const sdur=()=>60/P().bpm/4;
function tick(){
  if(!A.ctx)return;
  const ctx=A.ctx,now=ctx.currentTime,sd=sdur(),Pj=P(),pn=performance.now();
  /* adaptive look-ahead: measure how late the clock really fires and schedule further ahead when the device is struggling */
  if(A.lastTick){const gap=(pn-A.lastTick)/1000;A.jit=Math.max(gap,(A.jit||0)*.995)}
  A.lastTick=pn;
  const base=.2+sd*.5,look=Math.min(.5,Math.max(base,(A.jit||0)*1.4+.04));
  if(A.playing){
    if(A.nextT<now-.2)A.nextT=now+.02;
    while(A.nextT<now+look){
      if(A.g%GR.patLen(Pj)===0){if(Pj.song&&Pj.chain.length){Pj.pat=Pj.chain[A.sp%Pj.chain.length];A.sp++;Pj.nextPat=-1;U.patDirty=true}else if(Pj.nextPat>=0){Pj.pat=Pj.nextPat;Pj.nextPat=-1;U.patDirty=true}}
      GR.stepEvents(ctx,A.G,Pj,A.g,A.nextT,sd,A.fill,undefined);
      if(A.metro&&A.g%4===0)click(ctx,A.nextT,A.g%16===0);
      A.queue.push({g:A.g,t:A.nextT});A.g++;A.nextT+=sd;
    }
  }

}
function click(ctx,t,acc){
  const o=ctx.createOscillator(),g=ctx.createGain();
  o.type='square';o.frequency.value=acc?1760:1175;
  const mv=U.metVol==null?1:U.metVol;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime((acc?.22:.14)*mv*mv,t+.001);g.gain.exponentialRampToValueAtTime(.0008,t+.045);
  o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+.06);
}
function playPos(){
  if(!A.playing||!A.ctx)return -1;
  const now=A.ctx.currentTime;let g=-1;
  for(const q of A.queue){if(q.t<=now)g=q.g;else break}
  while(A.queue.length>2&&A.queue[1].t<=now)A.queue.shift();
  return g;
}
function playToggle(){
  if(!ensureAudio())return;
  if(A.playing){A.playing=false;A.queue=[];U.lastPG=-2;updatePlayhead(-1)}
  else{
    A.playing=true;A.g=0;A.sp=0;A.queue=[];A.nextT=A.ctx.currentTime+.06;
    if(A.rec&&U.countIn){const bd=60/P().bpm;for(let i=0;i<4;i++)click(A.ctx,A.nextT+i*bd,i===0);A.nextT+=4*bd;toast('Count in')}
  }
  syncTransport();vib(10);
}
function playNow(ti,note,vel,len,live){
  if(!ensureAudio())return;
  GR.trigger(A.ctx,A.G,P(),ti,{note,vel,len:len||1,lock:null},A.ctx.currentTime+.006,sdur());
  flashTrack(ti);
  if(A.rec&&A.playing)recWrite(ti,note,vel);
}
const QGRID=[4,2,1,.5],QNAME=['1/4','1/8','1/16','1/32'];
function qpos(pos,Q){const gs=QGRID[Q.grid]||1,tg=Math.round(pos/gs)*gs;return pos+(tg-pos)*Q.depth}
const qtxt=Q=>Q.depth<=0?'OFF':QNAME[Q.grid]+' '+Math.round(Q.depth*100)+'%';
function recWrite(ti,note,vel){
  const g=playPos();if(g<0)return;
  const q=A.queue.find(x=>x.g===g),frac=q?(A.ctx.currentTime-q.t)/sdur():0;
  const t=P().tracks[ti],qp=qpos(g+Math.max(0,Math.min(1.5,frac)),P().quant||{grid:2,depth:1});
  const sn=Math.round(qp),st=GR.stepAt(curPat()[ti],t.len,((sn%t.len)+t.len)%t.len);
  st.on=1;st.note=note;st.vel=vel;st.micro=Math.max(-12,Math.min(12,Math.round((qp-sn)*24)));dirty();if(U.tab==='seq'&&ti===U.tr)renderSeq();
}
const BPM_STEP=1;
function setBpm(v){P().bpm=clamp(Math.round(v),50,220);syncTransport();fxChanged();dirty()}

