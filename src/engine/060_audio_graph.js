/* ---------- audio graph ---------- */
function curveTanh(k){const n=2048,c=new Float32Array(n);for(let i=0;i<n;i++){const x=i/(n-1)*2-1;c[i]=Math.tanh(x*k)/Math.tanh(k)}return c}
const CURVES={};
function crushCurve(bits){
  if(CURVES[bits])return CURVES[bits];
  const n=4096,c=new Float32Array(n),L=Math.pow(2,bits-1);
  for(let i=0;i<n;i++){const x=i/(n-1)*2-1;c[i]=Math.round(x*L)/L}
  return CURVES[bits]=c;
}
/* safety soft clip: untouched up to 0.85, then a smooth knee to 1.0, so a stray over never hard-clips */
let SOFT=null;
function softCurve(){if(!SOFT){const n=4096,c=new Float32Array(n),k=.85;for(let i=0;i<n;i++){const x=i/(n-1)*2-1,a=Math.abs(x);c[i]=a<=k?x:Math.sign(x)*(k+(1-k)*Math.tanh((a-k)/(1-k)))}SOFT=c}return SOFT}
let TANH=null;
function tanhCurve(){return TANH||(TANH=curveTanh(3))}
function makeNoise(ctx){
  const n=ctx.sampleRate*2,b=ctx.createBuffer(1,n,ctx.sampleRate),d=b.getChannelData(0);
  for(let i=0;i<n;i++)d[i]=Math.random()*2-1;return b;
}
function makeRnd(ctx){
  const L=256*8,b=ctx.createBuffer(1,L,ctx.sampleRate),d=b.getChannelData(0);
  for(let s=0;s<8;s++){const v=Math.random()*2-1;for(let i=0;i<256;i++)d[s*256+i]=v}
  return b;
}

const ctx0=G=>G.ctx instanceof OfflineAudioContext;
GR.buildGraph=function(ctx){
  const G={ctx,tb:[],fxKey:{}};
  G.noise=makeNoise(ctx);G.rnd=makeRnd(ctx);
  G.sum=ctx.createGain();G.sum.gain.value=.3;
  /* send buses: the FX engine worklet (see attachFx) takes them over */
  G.d={in:ctx.createGain()};G.r={in:ctx.createGain()};G.c={in:ctx.createGain()};
  const mf=G.mf={};
  mf.in=ctx.createGain();mf.lp=ctx.createBiquadFilter();mf.hp=ctx.createBiquadFilter();mf.lp.type='lowpass';mf.hp.type='highpass';mf.vol=ctx.createGain();
  mf.in.connect(mf.lp);mf.lp.connect(mf.hp);mf.hp.connect(mf.vol);
  const cp=G.cp={};
  cp.comp=ctx.createDynamicsCompressor();cp.mk=ctx.createGain();cp.trim=ctx.createGain();cp.trim.gain.value=5.9;/* +15.4 dB: a typical beat peaks near -3 dBFS, the limiter catches the rest */cp.lim=ctx.createDynamicsCompressor();cp.dc=ctx.createBiquadFilter();cp.dc.type='highpass';cp.dc.frequency.value=8;cp.dc.Q.value=.5;cp.sc=ctx.createWaveShaper();cp.sc.curve=softCurve();cp.sc.oversample='2x';
  cp.lim.threshold.value=-2;cp.lim.knee.value=0;cp.lim.ratio.value=20;cp.lim.attack.value=.002;cp.lim.release.value=.08;
  G.an=ctx.createAnalyser();G.an.fftSize=1024;
  G.sum.connect(mf.in);
  mf.vol.connect(cp.dc);cp.dc.connect(cp.comp);cp.comp.connect(cp.mk);cp.mk.connect(cp.trim);cp.trim.connect(cp.lim);cp.lim.connect(cp.sc);cp.sc.connect(G.an);G.an.connect(ctx.destination);
  if(!(ctx instanceof OfflineAudioContext)&&ctx.createMediaStreamDestination){try{G.rec=ctx.createMediaStreamDestination();G.an.connect(G.rec)}catch(e){}}
  /* per-track bus builder */
  G.track=function(i){
    if(G.tb[i])return G.tb[i];
    const t={};
    t.in=ctx.createGain();t.dDry=ctx.createGain();t.dPre=ctx.createGain();t.dSh=ctx.createWaveShaper();t.dSh.curve=tanhCurve();t.dWet=ctx.createGain();
    t.dMix=ctx.createGain();t.cr=ctx.createWaveShaper();t.pan=ctx.createStereoPanner();t.lvl=ctx.createGain();
    t.sd=ctx.createGain();t.sr=ctx.createGain();t.sc=ctx.createGain();
    t.in.connect(t.dDry);t.dDry.connect(t.dMix);t.in.connect(t.dPre);t.dPre.connect(t.dSh);t.dSh.connect(t.dWet);t.dWet.connect(t.dMix);
    t.dk=ctx.createGain();t.dMix.connect(t.cr);t.cr.connect(t.pan);t.pan.connect(t.dk);t.cb=ctx.createGain();t.dk.connect(t.cb);t.cb.connect(t.lvl);
    t.cmp=ctx.createDynamicsCompressor();t.cmp.knee.value=6;t.cmk=ctx.createGain();t.cc=ctx.createGain();t.cc.gain.value=0;t.cmp.connect(t.cmk);t.cmk.connect(t.cc);t.cc.connect(t.lvl);t.cOn=false;
    t.lvl.connect(G.sum);t.lvl.connect(t.sd);t.sd.connect(G.d.in);t.lvl.connect(t.sr);t.sr.connect(G.r.in);t.lvl.connect(t.sc);t.sc.connect(G.c.in);
    t.an=ctx.createAnalyser();t.an.fftSize=256;t.lvl.connect(t.an);
    t.sd.gain.value=0;t.sr.gain.value=0;t.sc.gain.value=0;t.dWet.gain.value=0;
    G.tb[i]=t;G.refreshTrack(i);return t;
  };
  G.refreshTrack=function(i){
    const t=G.tb[i];if(!t)return;const tr=GR.proj.tracks[i],cr=tr.params[30];
    t.cr.curve=cr<.02?null:crushCurve(12-Math.floor(cr*9));
    const c=tr.cmp,on=!!(c&&c.on),sg=(p,v)=>ctx0(G)?p.setValueAtTime(v,0):p.setTargetAtTime(v,G.ctx.currentTime,.01);
    if(on){const v=c.v;t.cmp.threshold.value=-40+v[0]*40;t.cmp.ratio.value=1.5+v[1]*10.5;t.cmp.attack.value=.001+v[2]*.049;t.cmp.release.value=.05+v[3]*.35;const th=-40+v[0]*40,ra=1.5+v[1]*10.5;/* the browser compressor adds its own auto makeup (0.6 of the full scale reduction); cancel it so MAKEUP is the only gain */t.cmk.gain.value=Math.pow(10,(v[4]*12-.6*(-th)*(1-1/ra))/20)}
    if(on!==t.cOn){t.cOn=on;if(on)t.dk.connect(t.cmp);else{try{t.dk.disconnect(t.cmp)}catch(x){}}sg(t.cb.gain,on?0:1);sg(t.cc.gain,on?1:0)}
  };
  return G;
};

/* apply FX params to a graph. when = ctx time to set at */
GR.applyFx=function(G,P,when){
  const ctx=G.ctx,t=when==null?ctx.currentTime:when,f=P.fx,tc=.03,off=f.off||{};
  const set=(p,v)=>{if(ctx instanceof OfflineAudioContext)p.setValueAtTime(v,0);else p.setTargetAtTime(v,t,tc)};
  {const v=P.vol==null?1:P.vol;set(G.sum.gain,GR.mmute?0:.3*v*v)}/* master volume */
  if(G.fxn){
    const pr=G.fxn.parameters,sp=(n,v)=>set(pr.get(n),v);
    const fd=f.delay,fc=f.chorus,fr=f.reverb;
    sp('dlTime',clamp(DLY_BEATS[dval(fd[0],8)]*60/P.bpm*1000,20,1500));sp('dlFb',fd[1]*.92);sp('dlMix',off.delay?0:fd[2]);
    sp('chRate',.05*Math.pow(80,fc[0]));sp('chDepth',fc[1]);sp('chMix',off.chorus?0:fc[2]);
    sp('rvSize',fr[0]);sp('rvDamp',fr[1]);sp('rvMix',off.reverb?0:fr[2]);
  }
  const fm=f.filter,v=off.filter?.5:fm[0];
  set(G.mf.lp.frequency,v<.5?clamp(60*Math.pow(300,v/.5),60,20000):20000);
  set(G.mf.hp.frequency,v>.5?clamp(20*Math.pow(200,(v-.5)/.5),20,4000):20);
  set(G.mf.lp.Q,off.filter?.7:.7+fm[1]*10);set(G.mf.hp.Q,off.filter?.7:.7+fm[1]*6);set(G.mf.vol.gain,(off.filter?.7:fm[2])*1.25);
  const fk=off.comp?[0,0,.1,.3,0]:f.comp;
  G.cp.comp.threshold.value=-fk[0]*40;G.cp.comp.ratio.value=1+fk[1]*19;G.cp.comp.attack.value=.001+fk[2]*.1;G.cp.comp.release.value=.03+fk[3]*.5;G.cp.comp.knee.value=6;
  const thDb=-fk[0]*40,rt=1+fk[1]*19,outDb=thDb<-3?thDb+(0-thDb)/rt:-.2,auto=Math.pow(Math.pow(10,-outDb/20),.6)*1.14;
  set(G.cp.mk.gain,Math.pow(10,fk[4]*18/20)/auto);
};

