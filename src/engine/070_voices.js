/* ---------- voices ---------- */
const ENG_GAIN={SAMP:.9};
function voiceSamp(ctx,G,t,note,P,v,tr,durBox){
  const rev=dval(P[5],2)===1,buf=Samples.buf(tr.slot,rev);if(!buf)return null;
  const ns=[1,2,4,8,16][dval(P[6],5)],len=buf.duration;
  let a=Math.min(P[0],P[1]),b=Math.max(P[0],P[1]);if(b-a<.005)b=Math.min(1,a+.005);
  if(ns>1){const si=Math.min(ns-1,Math.floor(P[7]*ns));a=si/ns;b=(si+1)/ns}
  let o0=a*len,o1=b*len;if(rev){const x=len-o1,y=len-o0;o0=x;o1=y}
  const rate=Math.pow(2,((P[2]-.5)*48+note+(P[3]-.5))/12),src=ctx.createBufferSource(),loop=dval(P[4],2)===1;
  src.buffer=buf;src.playbackRate.value=rate;
  if(loop){src.loop=true;src.loopStart=o0;src.loopEnd=o1}
  src.start(t,o0,loop?undefined:Math.max(.001,o1-o0));
  v.srcs.push(src);v.pitch.push(src.detune);
  if(!loop)durBox.min=(o1-o0)/rate;
  return src;
}

function trackAudible(P,ti){
  const tr=P.tracks[ti];if(tr.mute)return false;
  if(P.tracks.some(x=>x.solo))return !!tr.solo;
  return true;
}
GR.trackAudible=trackAudible;

function effParams(P,ti,st){
  const tr=P.tracks[ti],out=Float32Array.from(tr.params);
  if(P.morph.on&&P.scenes.a&&P.scenes.b){const a=P.scenes.a[ti],b=P.scenes.b[ti],x=P.morph.x;for(let i=0;i<NPAR;i++)out[i]=lerp(a[i],b[i],x)}
  if(st&&st.lock)for(const k in st.lock)out[+k]=st.lock[k];
  return out;
}
GR.effParams=effParams;

/* trigger one voice at time t. st = {note,vel,len} (len in steps) */
/* multimode filter built from native nodes. returns {i,o,fp,dt}: fp = [{p,map}] frequency-like params the filter envelope drives, dt = detune params the LFO drives.
   LP 12, LP 24, HP, BAND, NOTCH are biquads; LADDER is four poles with drive; COMB is a short feed-forward comb tuned by the cutoff; FORMANT is three vowel bandpasses */
const VOWELS=[[800,1150,2900],[400,1600,2700],[270,2140,2950],[450,800,2830],[325,700,2700]];
function makeFilter(ctx,ty,fc,res){
  const F={fp:[],dt:[]},bq=(type,Q)=>{const f=ctx.createBiquadFilter();f.type=type;f.Q.value=Q;F.fp.push({p:f.frequency,map:v=>v});F.dt.push(f.detune);return f};
  const Q0=.3+res*res*16;
  if(ty===0){const f=bq('lowpass',Q0);F.i=F.o=f;F.first=f}
  else if(ty===1){const a=bq('lowpass',.5+res*res*8),b=bq('lowpass',.5+res*res*8);a.connect(b);F.i=a;F.o=b}
  else if(ty===2){const f=bq('highpass',Q0);F.i=F.o=f}
  else if(ty===3){const f=bq('bandpass',.7+res*res*14);F.i=F.o=f}
  else if(ty===4){const f=bq('notch',.7+res*res*10);F.i=F.o=f}
  else if(ty===5){
    const pre=ctx.createWaveShaper();pre.curve=tanhCurve();const post=ctx.createWaveShaper();post.curve=tanhCurve();const g=ctx.createGain();g.gain.value=2.2;const og=ctx.createGain();og.gain.value=.7;
    pre.connect(g);let prev=g;[.55,.55,.55,.6+res*12].forEach(q=>{const f=bq('lowpass',q);prev.connect(f);prev=f});
    prev.connect(post);post.connect(og);F.i=pre;F.o=og;
  }else if(ty===6){
    const i=ctx.createGain(),o=ctx.createGain(),d=ctx.createDelay(.03),k=ctx.createGain();k.gain.value=.35+res*.6;o.gain.value=.65;
    i.connect(o);i.connect(d);d.connect(k);k.connect(o);d.delayTime.value=1/clamp(fc,80,12000);
    F.fp.push({p:d.delayTime,map:v=>1/clamp(v,80,12000)});F.i=i;F.o=o;F.delay=d;
  }else{
    const u=clamp(Math.log(fc/30)/Math.log(19500/30),0,1)*(VOWELS.length-1),a=Math.min(VOWELS.length-2,Math.floor(u)),fr=u-a;
    const i=ctx.createGain(),o=ctx.createGain();o.gain.value=2.2;
    [1,.55,.3].forEach((w,j)=>{const f=ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=VOWELS[a][j]+(VOWELS[a+1][j]-VOWELS[a][j])*fr;f.Q.value=5+res*14;const g=ctx.createGain();g.gain.value=w;i.connect(f);f.connect(g);g.connect(o);F.dt.push(f.detune)});
    F.i=i;F.o=o;F.static=true;
  }
  F.init=hz=>F.fp.forEach(x=>{x.p.value=x.map(hz)});
  F.at=(fn)=>F.fp.forEach(x=>fn({setValueAtTime:(v,t)=>x.p.setValueAtTime(x.map(v),t),exponentialRampToValueAtTime:(v,t)=>x.p.exponentialRampToValueAtTime(x.map(v),t),setTargetAtTime:(v,t,c)=>x.p.setTargetAtTime(x.map(v),t,c)}));
  return F;
}
GR.trigger=function(ctx,G,P,ti,st,t,stepDur){
  const rt=!(ctx instanceof OfflineAudioContext);
  if(rt&&(G.nv||0)>(GR.lite?36:72))return;
  const tr=P.tracks[ti],Pa=effParams(P,ti,st),eng=tr.engine,vel=clamp(st.vel==null?.8:st.vel,.02,1);
  const tb=G.track(ti),RT=tr.routes||[],rsum=(sr,d)=>RT.reduce((x,r)=>x+(r.s===sr&&r.d===d?r.a:0),0);
  const mixv=(p,v)=>p.setValueAtTime(v,t);
  const lv=Pa[24];mixv(tb.lvl.gain,lv*lv*.62);mixv(tb.pan.pan,clamp(Pa[25]*2-1+(vel-.5)*2*rsum(3,'pan'),-1,1));
  mixv(tb.sd.gain,Pa[26]*Pa[26]);mixv(tb.sr.gain,Pa[27]*Pa[27]);mixv(tb.sc.gain,Pa[28]*Pa[28]);
  const dr=Pa[29];mixv(tb.dDry.gain,1-dr);mixv(tb.dWet.gain,dr*.9);mixv(tb.dPre.gain,1+dr*10);{const os=dr>.02?'2x':'none';if(tb.dSh.oversample!==os)tb.dSh.oversample=os}
  let dur=stepDur*(st.len||1)*(.2+Pa[31]*1.6);
  const atk=T_ATK(Pa[11]),dec=T_DEC(Pa[12]),sus=Pa[13],rel=T_REL(Pa[14]);
  const v={srcs:[],pitch:[],shape:[]},durBox={min:0};
  const note=st.note||0;
  const lfos=[[16,19],[20,23]].map((L,i)=>({rate:LFOHZ(Pa[L[0]]),shape:dval(Pa[L[1]],5),i}));
  const out=voiceSamp(ctx,G,t,note,Pa,v,tr,durBox);
  if(!out)return;{const vp=(vel-.5)*2*rsum(3,'pitch')*1200,ep=rsum(2,'pitch')*1200;v.pitch.forEach(p=>{if(vp)p.value=vp;if(ep){p.setValueAtTime(vp+ep,t);p.setTargetAtTime(vp,t,T_DEC(Pa[33])/3+.002)}})}
  if(durBox.min>dur)dur=durBox.min;
  const fty=dval(Pa[15],8);
  let fc=CUTHZ(Pa[8]);
  fc*=Math.pow(2,(vel-.5)*4*(Pa[36]+rsum(3,'cut')));
  fc=clamp(fc,30,19500);
  const f=makeFilter(ctx,fty,fc,Pa[9]);
  const envO=(Pa[10]+rsum(2,'cut'))*6,fatk=T_ATK(Pa[32]),fdec=T_DEC(Pa[33]),frel=T_REL(Pa[35]);let fenv=false;
  if(Math.abs(envO)>.02&&!f.static){
    const pk=Math.max(30,Math.min(19500,fc*Math.pow(2,envO))),sl=Math.max(30,Math.min(19500,fc*Math.pow(2,envO*Pa[34])));fenv=true;
    f.at(q=>{
      if(fatk<.004)q.setValueAtTime(pk,t);else{q.setValueAtTime(fc,t);q.exponentialRampToValueAtTime(pk,t+fatk)}
      q.setTargetAtTime(sl,t+(fatk<.004?0:fatk),fdec/3+.002);
    });
  }else f.init(fc);
  const amp=ctx.createGain(),g=amp.gain,peak=Math.pow(vel,.3+Pa[37]*2)*ENG_GAIN[eng]*Math.max(0,1+(vel-.5)*2*rsum(3,'level'));
  g.setValueAtTime(0,t);
  g.linearRampToValueAtTime(peak,t+atk);g.setTargetAtTime(peak*sus,t+atk,dec/3+.001);
  const tEnd=Math.max(t+dur,t+atk+.003);
  g.setTargetAtTime(0,tEnd,rel/3+.001);if(fenv)f.at(q=>q.setTargetAtTime(fc,tEnd,frel/3+.002));
  const tStop=tEnd+Math.max(rel,fenv?frel:0)*2+.06;
  out.connect(f.i);f.o.connect(amp);
  let last=amp;
  lfos.forEach(L=>{
    const rl=RT.filter(r=>r.s===L.i&&r.a);if(!rl.length)return;
    const node=makeLfoSafe(ctx,G,L.shape,L.rate,t,v);
    rl.forEach(r=>{const dp=r.a,gn=ctx.createGain();node.connect(gn);
      if(r.d==='cut'){gn.gain.value=dp*3600;f.dt.forEach(d=>gn.connect(d));if(f.delay){const dg=ctx.createGain();dg.gain.value=dp*f.delay.delayTime.value*.6;node.connect(dg);dg.connect(f.delay.delayTime)}}
      else if(r.d==='pitch'){gn.gain.value=dp*1200;v.pitch.forEach(p=>{try{gn.connect(p)}catch(e){}})}
      else if(r.d==='level'){const ad=Math.abs(dp),tr2=ctx.createGain();tr2.gain.value=1-ad*.5;gn.gain.value=dp*.5;gn.connect(tr2.gain);last.connect(tr2);last=tr2}
      else if(r.d==='pan'){const pn=ctx.createStereoPanner();gn.gain.value=dp;gn.connect(pn.pan);last.connect(pn);last=pn}
    });
  });
  last.connect(tb.in);
  const s0=v.srcs[0];
  v.srcs.forEach(s=>{try{s.stop(tStop)}catch(e){}});
  if(rt)G.nv=(G.nv||0)+1;
  let cd=false;const cleanup=()=>{if(!cd){cd=true;if(rt)G.nv=Math.max(0,(G.nv||1)-1)}try{amp.disconnect();last.disconnect()}catch(e){}};
  if(s0){s0.onended=cleanup}else setTimeout(cleanup,(tStop-ctx.currentTime+.5)*1000);
};
function makeLfoSafe(ctx,G,shape,rate,t,v){
  let n;
  if(shape===4){n=ctx.createBufferSource();n.buffer=G.rnd;n.loop=true;n.playbackRate.value=Math.max(.01,rate*256/ctx.sampleRate);n.start(t)}
  else{n=ctx.createOscillator();n.type=['sine','triangle','square','sawtooth'][shape];n.frequency.value=rate;n.start(t)}
  v.srcs.push(n);return n;
}

